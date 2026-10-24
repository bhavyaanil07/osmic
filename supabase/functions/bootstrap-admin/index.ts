// First-time setup: creates the admin account and emails a "set your password" link.
// Works only while there is no admin yet, and only for the email saved as the ADMIN_EMAIL secret.
import { admin, json, portalLink, serve, UserError } from '../_shared/util.ts';
import { sendMail, welcomeMail } from '../_shared/mail.ts';

serve(async (req) => {
  const { email, name } = await req.json().catch(() => ({}));
  const db = admin();

  const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  if ((count ?? 0) > 0) throw new UserError('The admin account already exists. Log in, or use "Forgot password?".', 409);

  const allowed = (Deno.env.get('ADMIN_EMAIL') ?? '').trim().toLowerCase();
  const wanted = String(email ?? '').trim().toLowerCase();
  if (!allowed) throw new UserError('The ADMIN_EMAIL secret is not set yet. See the setup guide.', 500);
  if (wanted !== allowed) throw new UserError("That isn't the email chosen for the admin account.", 403);
  const displayName = String(name ?? '').trim().slice(0, 100) || 'OSMIC Admin';

  // Create the login (or get a fresh link if it was created before but never finished).
  let link = await db.auth.admin.generateLink({ type: 'invite', email: wanted, options: { data: { name: displayName } } });
  let type: 'invite' | 'recovery' = 'invite';
  if (link.error) {
    link = await db.auth.admin.generateLink({ type: 'recovery', email: wanted });
    type = 'recovery';
  }
  if (link.error || !link.data.user) throw new Error(`generateLink failed: ${link.error?.message}`);

  const { error } = await db.from('profiles').upsert({ id: link.data.user.id, name: displayName, email: wanted, role: 'admin', active: true });
  if (error) throw new Error(`profile insert failed: ${error.message}`);

  const mail = welcomeMail(displayName, portalLink(link.data.properties.hashed_token, type), true);
  await sendMail([wanted], mail.subject, mail.html, mail.text);
  await db.from('outbox').insert({ kind: 'welcome_admin', to_emails: [wanted], subject: mail.subject, sent_at: new Date().toISOString() });

  return json(req, { ok: true });
});
