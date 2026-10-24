// Sends email through the club's Gmail account, and holds every email template.
import nodemailer from 'npm:nodemailer@6.10.1';
import { PORTAL_URL } from './util.ts';

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function gmail() {
  const user = Deno.env.get('GMAIL_USER');
  const pass = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s+/g, '');
  if (!user || !pass) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD are not set');
  // Port 465 (SSL): Supabase blocks ports 25 and 587.
  transport ??= nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  return { transport, user };
}

// One recipient: normal email. Several: sent to the club address with everyone in BCC,
// so members don't see each other's addresses.
export async function sendMail(to: string[], subject: string, html: string, text: string) {
  const list = [...new Set(to.filter(Boolean))];
  if (!list.length) return;
  const { transport, user } = gmail();
  const from = `"OSMIC" <${user}>`;
  if (list.length === 1) await transport.sendMail({ from, to: list[0], subject, html, text });
  else await transport.sendMail({ from, to: user, bcc: list, subject, html, text });
}

// ---------- templates ----------
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const fmtDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

type Mail = { subject: string; html: string; text: string };

function layout(heading: string, paragraphs: string[], button?: { label: string; url: string }, footnote?: string): { html: string; text: string } {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#C9D6D8">${p}</p>`).join('');
  const btn = button
    ? `<p style="margin:22px 0"><a href="${esc(button.url)}" style="display:inline-block;background:#3EE6C8;color:#06161D;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(button.label)}</a></p>`
    : '';
  const foot = footnote ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#7E9A9F">${footnote}</p>` : '';
  const html = `<!doctype html><html><body style="margin:0;background:#06161D;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#0B2530;border:1px solid #163541;border-radius:16px" cellspacing="0" cellpadding="0"><tr><td style="padding:28px">
<p style="margin:0 0 18px;font-weight:800;letter-spacing:3px;color:#EEF3F2;font-size:16px">OSMIC <span style="color:#3EE6C8;font-size:11px;letter-spacing:2px">CLUB PORTAL</span></p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#EEF3F2">${esc(heading)}</h1>
${body}${btn}${foot}
</td></tr></table>
<p style="margin:16px 0 0;font-size:11px;color:#7E9A9F">From Ideas to Impact.</p>
</td></tr></table></body></html>`;
  const text = [heading, '', ...paragraphs.map((p) => p.replace(/<[^>]+>/g, '')), button ? `\n${button.label}: ${button.url}` : '', footnote ? `\n${footnote.replace(/<[^>]+>/g, '')}` : ''].join('\n');
  return { html, text };
}

export function welcomeMail(name: string, link: string, isAdmin = false): Mail {
  const { html, text } = layout(
    isAdmin ? 'Set up your OSMIC admin account' : `Welcome to OSMIC, ${name.split(' ')[0]}!`,
    isAdmin
      ? ['This link sets the password for the OSMIC portal admin account.']
      : ['Your application was approved. Set your password to open the member portal.', 'Your username is this email address.'],
    { label: 'Set your password', url: link },
    'This link works once and expires after 24 hours. If it has expired, use "Forgot password?" on the login page.',
  );
  return { subject: isAdmin ? 'Your OSMIC admin account' : 'Welcome to OSMIC! Set your password', html, text };
}

export function resetMail(link: string): Mail {
  const { html, text } = layout('Reset your password', ['Someone (hopefully you) asked to reset the password for your OSMIC portal account.'],
    { label: 'Choose a new password', url: link }, "If you didn't ask for this, you can ignore this email.");
  return { subject: 'Reset your OSMIC password', html, text };
}

const portal = (path = '') => `${PORTAL_URL}#${path || '/login'}`;

// Emails queued in the outbox by the database.
export function renderQueued(kind: string, subject: string, p: Record<string, any>): Mail {
  switch (kind) {
    case 'new_task':
      return { subject, ...layout(`New task: ${p.title}`, [
        `<b>${esc(p.by)}</b> gave you a task. Deadline: <b>${esc(fmtDate(p.deadline))}</b>.`,
        p.description ? esc(p.description) : '',
      ].filter(Boolean), { label: 'Open My tasks', url: portal('/member/tasks') }) };
    case 'task_result': {
      const pass = p.verdict === 'pass';
      return { subject, ...layout(pass ? `You passed: ${p.task}` : `Not passed yet: ${p.task}`, [
        pass ? 'Great work! Your submission was marked <b>Pass</b>.' : 'Your submission was marked <b>Fail</b>. You can submit it again.',
        p.comment ? `Reviewer's comment: “${esc(p.comment)}”` : '',
      ].filter(Boolean), { label: 'See the result', url: portal('/member/tasks') }) };
    }
    case 'leave_decision':
      return { subject, ...layout(`Your leave was ${p.status}`, [
        `Leave from <b>${esc(fmtDate(p.from))}</b>${p.to && p.to !== p.from ? ` to <b>${esc(fmtDate(p.to))}</b>` : ''} was <b>${esc(p.status)}</b>.`,
        p.note ? `Note: “${esc(p.note)}”` : '',
      ].filter(Boolean), { label: 'Open Leave', url: portal('/member/leave') }) };
    case 'announcement':
      return { subject, ...layout(p.title, [esc(p.message).replace(/\n/g, '<br>'), p.by ? `— ${esc(p.by)}` : ''].filter(Boolean),
        { label: 'Open the portal', url: portal('/member') }) };
    case 'application_rejected':
      return { subject, ...layout('About your OSMIC application', [
        `Hi ${esc(String(p.name).split(' ')[0])}, thank you for applying to OSMIC.`,
        "We aren't able to take you in this time. Keep building, and feel free to apply again later.",
      ]) };
    case 'now_lead':
      return { subject, ...layout('You are now a club lead', [
        `Congratulations, ${esc(String(p.name).split(' ')[0])}! You can now review your team's tasks and leave requests.`,
      ], { label: 'Open the club lead portal', url: portal('/lead') }) };
    case 'deadline_reminder':
      return { subject, ...layout(`Due tomorrow: ${p.title}`, [
        `Your task <b>${esc(p.title)}</b> is due on <b>${esc(fmtDate(p.deadline))}</b> and you haven't submitted it yet.`,
      ], { label: 'Submit your work', url: portal('/member/tasks') }) };
    case 'daily_summary':
      return { subject, ...layout('Waiting for you today', (p.lines as string[]).map(esc), { label: 'Open the portal', url: portal(p.path) }) };
    default:
      return { subject, ...layout(subject, [esc(p.message ?? '')]) };
  }
}
