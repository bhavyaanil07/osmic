// Face ID / fingerprint sign-in using passkeys (the browser's WebAuthn feature).
// The device's own lock (Windows Hello, Touch ID, Face ID, Android fingerprint) does the scan;
// the website never sees the fingerprint or face, only a yes/no and a key ID.
//
// Stage 1 (demo): the result is checked in the browser.
// Stage 2: the server (Supabase) will verify the signed answer for real security.

const toB64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));

// Can this device do Face ID / fingerprint / Windows Hello?
export async function passkeySupported() {
  try {
    if (!window.isSecureContext || !window.PublicKeyCredential) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// A friendly name for the device, shown on the Security page.
export function deviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iPhone / iPad (Face ID or Touch ID)';
  if (/Android/.test(ua)) return 'Android phone (fingerprint or face)';
  if (/Mac/.test(ua)) return 'Mac (Touch ID)';
  if (/Windows/.test(ua)) return 'Windows laptop (Windows Hello)';
  return 'This device';
}

// Turn a browser error into a plain sentence.
function explain(err) {
  if (err?.name === 'NotAllowedError') return 'The scan was cancelled or timed out. Try again.';
  if (err?.name === 'InvalidStateError') return 'Face ID / fingerprint is already set up on this device.';
  if (err?.name === 'SecurityError') return 'Face ID / fingerprint only works on https:// or localhost.';
  return 'Face ID / fingerprint did not work on this device.';
}

// Set up: the device asks for a scan and creates a key for this user.
export async function registerPasskey(user, existingIds = []) {
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'OSMIC Portal', id: window.location.hostname },
        user: { id: new TextEncoder().encode(user.id), name: user.email, displayName: user.name },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        excludeCredentials: existingIds.map((id) => ({ type: 'public-key', id: fromB64url(id) })),
        timeout: 60000,
        attestation: 'none',
      },
    });
    return { id: toB64url(cred.rawId), device: deviceLabel(), createdAt: new Date().toISOString() };
  } catch (err) {
    return { error: explain(err) };
  }
}

// Sign in: the device asks for a scan and answers with one of the saved keys.
export async function signInWithPasskey(allowedIds) {
  try {
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: window.location.hostname,
        allowCredentials: allowedIds.map((id) => ({ type: 'public-key', id: fromB64url(id) })),
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return { id: toB64url(cred.rawId) };
  } catch (err) {
    return { error: explain(err) };
  }
}
