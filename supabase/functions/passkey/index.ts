// Face ID / fingerprint sign-in for the admin (passkeys / WebAuthn), checked here on the server.
// The device does the scan and signs a one-time challenge; this function verifies that signature
// with the public key saved when the device was set up, then hands the browser a one-time sign-in token.
import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
} from 'npm:@simplewebauthn/server@13.3.3';
import { isoBase64URL } from 'npm:@simplewebauthn/server@13.3.3/helpers';
import { admin, json, originOf, requireAdmin, serve, UserError } from '../_shared/util.ts';

serve(async (req) => {
  const db = admin();
  const body = await req.json().catch(() => ({}));
  const origin = originOf(req);
  if (!origin) throw new UserError('Face ID / fingerprint only works from the OSMIC portal.', 403);
  const rpID = new URL(origin).hostname;

  async function saveChallenge(challenge: string, kind: 'register' | 'login', userId: string | null) {
    await db.from('webauthn_challenges').delete().lt('expires_at', new Date().toISOString());
    const { data, error } = await db.from('webauthn_challenges').insert({ challenge, kind, user_id: userId }).select('id').single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }
  async function takeChallenge(id: string, kind: 'register' | 'login', userId: string | null) {
    const { data } = await db.from('webauthn_challenges').delete().eq('id', id).eq('kind', kind).select('challenge, user_id, expires_at').maybeSingle();
    if (!data || new Date(data.expires_at) < new Date() || (userId && data.user_id !== userId)) {
      throw new UserError('That took too long. Please try again.');
    }
    return data.challenge as string;
  }

  switch (body.action) {
    // ----- set up a device (admin, already signed in) -----
    case 'register-options': {
      const me = await requireAdmin(req, db);
      const { data: keys } = await db.from('passkeys').select('id, transports').eq('user_id', me.id);
      const options = await generateRegistrationOptions({
        rpName: 'OSMIC Portal',
        rpID,
        userName: me.email,
        userDisplayName: me.name,
        userID: new TextEncoder().encode(me.id),
        attestationType: 'none',
        excludeCredentials: (keys ?? []).map((k) => ({ id: k.id, transports: k.transports })),
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
      });
      return json(req, { options, challengeId: await saveChallenge(options.challenge, 'register', me.id) });
    }
    case 'register-verify': {
      const me = await requireAdmin(req, db);
      const expectedChallenge = await takeChallenge(body.challengeId, 'register', me.id);
      const v = await verifyRegistrationResponse({
        response: body.response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
      }).catch((e) => { throw new UserError(`The device's answer could not be verified (${e.message}).`); });
      if (!v.verified || !v.registrationInfo) throw new UserError("The device's answer could not be verified.");
      const { credential } = v.registrationInfo;
      const { error } = await db.from('passkeys').insert({
        id: credential.id, user_id: me.id, public_key: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter, transports: credential.transports ?? [], device: String(body.device ?? '').slice(0, 80),
      });
      if (error) throw new UserError(error.code === '23505' ? 'This device is already set up.' : error.message);
      return json(req, { ok: true });
    }

    // ----- sign in (not signed in yet) -----
    case 'login-options': {
      const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin').eq('active', true);
      const { data: keys } = await db.from('passkeys').select('id, transports').in('user_id', (admins ?? []).map((a) => a.id));
      if (!keys?.length) throw new UserError('Face ID / fingerprint is not set up yet. Log in with your password, then open Security.');
      const options = await generateAuthenticationOptions({
        rpID, userVerification: 'required', allowCredentials: keys.map((k) => ({ id: k.id, transports: k.transports })),
      });
      return json(req, { options, challengeId: await saveChallenge(options.challenge, 'login', null) });
    }
    case 'login-verify': {
      const expectedChallenge = await takeChallenge(body.challengeId, 'login', null);
      const credId = String(body.response?.id ?? '');
      const { data: key } = await db.from('passkeys').select('*').eq('id', credId).maybeSingle();
      if (!key) throw new UserError('This device is not set up for the admin account.');
      const { data: owner } = await db.from('profiles').select('id, email, role, active').eq('id', key.user_id).maybeSingle();
      if (!owner || owner.role !== 'admin' || !owner.active) throw new UserError('This device is not linked to an active admin account.', 403);
      const v = await verifyAuthenticationResponse({
        response: body.response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
        credential: { id: key.id, publicKey: isoBase64URL.toBuffer(key.public_key), counter: Number(key.counter), transports: key.transports },
      }).catch((e) => { throw new UserError(`The scan could not be verified (${e.message}).`); });
      if (!v.verified) throw new UserError('The scan could not be verified.');
      await db.from('passkeys').update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq('id', key.id);
      const link = await db.auth.admin.generateLink({ type: 'magiclink', email: owner.email });
      if (link.error) throw new Error(link.error.message);
      return json(req, { tokenHash: link.data.properties.hashed_token });
    }
    default:
      throw new UserError('Unknown action.');
  }
});
