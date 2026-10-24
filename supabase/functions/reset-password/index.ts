// "Forgot password?": emails a link to choose a new password.
// Always answers "ok" so nobody can use it to find out who is a member.
import { admin, json, portalLink, serve } from '../_shared/util.ts';
import { resetMail, sendMail } from '../_shared/mail.ts';

serve(async (req) => {
  const { email } = await req.json().catch(() => ({}));
  const wanted = String(email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(wanted)) return json(req, { ok: true });

  const db = admin();
  const { data: p } = await db.from('profiles').select('id, active').ilike('email', wanted).maybeSingle();
  if (p?.active) {
    const link = await db.auth.admin.generateLink({ type: 'recovery', email: wanted });
    if (!link.error) {
      const mail = resetMail(portalLink(link.data.properties.hashed_token, 'recovery'));
      try {
        await sendMail([wanted], mail.subject, mail.html, mail.text);
      } catch (err) {
        console.error('reset email failed', err);
      }
    }
  }
  return json(req, { ok: true });
});
