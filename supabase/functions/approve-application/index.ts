// Admin approves an application: creates the login and profile (as a member in a club lead's team,
// as a new club lead, or as a member with no lead yet) and emails a "set your password" link.
import { admin, json, portalLink, requireAdmin, serve, UserError } from '../_shared/util.ts';
import { sendMail, welcomeMail } from '../_shared/mail.ts';

serve(async (req) => {
  const db = admin();
  await requireAdmin(req, db);
  // joinAs: 'member' (default, needs a club lead), 'lead' (becomes a club lead) or 'unassigned' (member with no lead yet)
  const { applicationId, joinAs: rawJoinAs } = await req.json().catch(() => ({}));
  const joinAs = rawJoinAs === 'lead' || rawJoinAs === 'unassigned' ? rawJoinAs : 'member';

  const { data: app } = await db.from('applications').select('*').eq('id', applicationId).maybeSingle();
  if (!app) throw new UserError('Application not found.', 404);
  if (app.status !== 'pending') throw new UserError('This application was already decided.');
  let lead: { id: string; name: string } | null = null;
  if (joinAs === 'member') {
    if (!app.lead_id) throw new UserError(`Choose a club lead for ${app.name} before approving.`);
    const { data } = await db.from('profiles').select('id, name, role, active').eq('id', app.lead_id).maybeSingle();
    if (!data || data.role !== 'lead' || !data.active) throw new UserError('The chosen club lead is not available. Pick another lead.');
    lead = data;
  }

  const { data: existing } = await db.from('profiles').select('id').ilike('email', app.email).maybeSingle();
  if (existing) throw new UserError('Someone with this email is already a member.');

  const link = await db.auth.admin.generateLink({ type: 'invite', email: app.email, options: { data: { name: app.name } } });
  if (link.error || !link.data.user) throw new UserError(`Could not create the account: ${link.error?.message ?? 'unknown error'}`);
  const userId = link.data.user.id;

  const { error: pErr } = await db.from('profiles').insert({
    id: userId, name: app.name, email: app.email, roll: app.roll, mobile: app.mobile, whatsapp: app.whatsapp,
    photo_path: app.photo_path, role: joinAs === 'lead' ? 'lead' : 'member', lead_id: lead?.id ?? null, active: true,
  });
  if (pErr) {
    await db.auth.admin.deleteUser(userId);
    throw new UserError(`Could not create the profile: ${pErr.message}`);
  }
  await db.from('applications').update({ status: 'approved', user_id: userId, lead_id: lead?.id ?? null, decided_at: new Date().toISOString() }).eq('id', app.id);

  const mail = welcomeMail(app.name, portalLink(link.data.properties.hashed_token, 'invite'), false, joinAs === 'lead');
  let emailed = true;
  try {
    await sendMail([app.email], mail.subject, mail.html, mail.text);
    await db.from('outbox').insert({ kind: 'welcome', to_emails: [app.email], subject: mail.subject, sent_at: new Date().toISOString() });
  } catch (err) {
    emailed = false;
    console.error('welcome email failed', err);
    await db.from('outbox').insert({ kind: 'welcome', to_emails: [app.email], subject: mail.subject, attempts: 5, last_error: String(err) });
  }
  return json(req, { ok: true, name: app.name, lead: lead?.name ?? null, joinAs, emailed });
});
