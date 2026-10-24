// Sends queued emails. Runs every 5 minutes (scheduled job) and also right after actions in the portal.
// The scheduled run additionally sends deadline reminders and the 8 AM daily summary.
import { admin, caller, json, serve, todayIST, UserError } from '../_shared/util.ts';
import { renderQueued, sendMail } from '../_shared/mail.ts';

type Db = ReturnType<typeof admin>;

async function flushOutbox(db: Db) {
  const { data: rows } = await db.from('outbox').select('*').is('sent_at', null).lt('attempts', 5).order('created_at').limit(25);
  let sent = 0;
  for (const r of rows ?? []) {
    try {
      const mail = renderQueued(r.kind, r.subject, r.payload ?? {});
      await sendMail(r.to_emails, mail.subject, mail.html, mail.text);
      await db.from('outbox').update({ sent_at: new Date().toISOString(), attempts: r.attempts + 1, last_error: null }).eq('id', r.id);
      sent += 1;
    } catch (err) {
      await db.from('outbox').update({ attempts: r.attempts + 1, last_error: String(err).slice(0, 500) }).eq('id', r.id);
    }
  }
  return sent;
}

// Tasks due tomorrow: remind everyone who hasn't submitted yet (once per person per task).
async function deadlineReminders(db: Db) {
  const tomorrow = new Date(Date.parse(`${todayIST()}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
  const { data: tasks } = await db.from('tasks').select('id, title, deadline').eq('deadline', tomorrow);
  let queued = 0;
  for (const t of tasks ?? []) {
    const [{ data: assignees }, { data: subs }, { data: done }] = await Promise.all([
      db.from('task_assignees').select('user_id').eq('task_id', t.id),
      db.from('submissions').select('user_id').eq('task_id', t.id),
      db.from('reminder_log').select('user_id').eq('task_id', t.id),
    ]);
    const skip = new Set([...(subs ?? []), ...(done ?? [])].map((x) => x.user_id));
    const ids = (assignees ?? []).map((a) => a.user_id).filter((id) => !skip.has(id));
    if (!ids.length) continue;
    const { data: people } = await db.from('profiles').select('id, email').in('id', ids).eq('active', true);
    if (!people?.length) continue;
    await db.from('outbox').insert({ kind: 'deadline_reminder', to_emails: people.map((p) => p.email), subject: `Due tomorrow: ${t.title}`, payload: { title: t.title, deadline: t.deadline } });
    await db.from('reminder_log').insert(people.map((p) => ({ task_id: t.id, user_id: p.id })));
    queued += 1;
  }
  return queued;
}

// Once a day after 8 AM (India time): tell the admin and each lead what's waiting for them.
async function dailySummary(db: Db) {
  const hourIST = new Date(Date.now() + 5.5 * 3600e3).getUTCHours();
  const today = todayIST();
  if (hourIST < 8) return false;
  const { data: run } = await db.from('job_runs').select('last_run').eq('job', 'daily_summary').maybeSingle();
  if (run?.last_run === today) return false;
  await db.from('job_runs').upsert({ job: 'daily_summary', last_run: today });

  const [{ data: profiles }, { data: apps }, { data: subs }, { data: leaves }, { data: sessions }] = await Promise.all([
    db.from('profiles').select('id, name, email, role, lead_id, active'),
    db.from('applications').select('id').eq('status', 'pending'),
    db.from('submissions').select('user_id').eq('verdict', 'pending'),
    db.from('leaves').select('user_id').eq('status', 'pending'),
    db.from('sessions').select('id').order('started_at', { ascending: false }).limit(1),
  ]);
  const people = (profiles ?? []).filter((p) => p.active);
  const leadOf = new Map(people.map((p) => [p.id, p.lead_id]));
  const { data: checkins } = sessions?.[0]
    ? await db.from('attendance').select('id').eq('session_id', sessions[0].id).eq('status', 'pending')
    : { data: [] };
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  for (const a of people.filter((p) => p.role === 'admin')) {
    const lines = [
      apps?.length ? `${plural(apps.length, 'new application', 'new applications')} to approve or reject` : '',
      checkins?.length ? `${plural(checkins.length, 'check-in', 'check-ins')} to verify` : '',
      subs?.length ? `${plural(subs.length, 'task submission', 'task submissions')} waiting for a result` : '',
      leaves?.length ? `${plural(leaves.length, 'leave request', 'leave requests')} waiting for a decision` : '',
    ].filter(Boolean);
    if (lines.length) await db.from('outbox').insert({ kind: 'daily_summary', to_emails: [a.email], subject: 'OSMIC: waiting for you today', payload: { lines, path: '/admin' } });
  }
  for (const l of people.filter((p) => p.role === 'lead')) {
    const s = (subs ?? []).filter((x) => leadOf.get(x.user_id) === l.id).length;
    const v = (leaves ?? []).filter((x) => leadOf.get(x.user_id) === l.id).length;
    const lines = [
      s ? `${plural(s, 'submission', 'submissions')} from your team to review` : '',
      v ? `${plural(v, 'leave request', 'leave requests')} from your team` : '',
    ].filter(Boolean);
    if (lines.length) await db.from('outbox').insert({ kind: 'daily_summary', to_emails: [l.email], subject: 'OSMIC: waiting for you today', payload: { lines, path: '/lead' } });
  }
  return true;
}

serve(async (req) => {
  const db = admin();
  const secret = req.headers.get('x-cron-secret') ?? '';
  let scheduled = false;
  if (secret) {
    const { data } = await db.rpc('check_cron_secret', { p_secret: secret });
    scheduled = data === true;
  }
  // Anyone signed in may ask for the queue to be sent now (it only sends emails that are already queued).
  if (!scheduled && !(await caller(req, db))) throw new UserError('Not allowed.', 401);

  let reminders = 0;
  let summary = false;
  if (scheduled) {
    reminders = await deadlineReminders(db);
    summary = await dailySummary(db);
  }
  const sent = await flushOutbox(db);
  return json(req, { ok: true, sent, reminders, summary });
});
