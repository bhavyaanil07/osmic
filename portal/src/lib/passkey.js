// Face ID / fingerprint sign-in (passkeys). The device does the scan and signs a one-time challenge;
// the OSMIC server checks the signature before letting anyone in.
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { callFunction } from './supabase';

export async function passkeySupported() {
  try {
    return window.isSecureContext && browserSupportsWebAuthn() && (await platformAuthenticatorIsAvailable());
  } catch {
    return false;
  }
}

export function deviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iPhone / iPad (Face ID or Touch ID)';
  if (/Android/.test(ua)) return 'Android phone (fingerprint or face)';
  if (/Mac/.test(ua)) return 'Mac (Touch ID)';
  if (/Windows/.test(ua)) return 'Windows laptop (Windows Hello)';
  return 'This device';
}

function explain(err) {
  if (err?.name === 'NotAllowedError') return 'The scan was cancelled or timed out. Try again.';
  if (err?.name === 'InvalidStateError') return 'Face ID / fingerprint is already set up on this device.';
  if (err?.name === 'SecurityError') return 'Face ID / fingerprint only works on the OSMIC portal address (https) or localhost.';
  return err?.message || 'Face ID / fingerprint did not work on this device.';
}

// Set up this device for the signed-in admin.
export async function registerPasskey() {
  try {
    const { options, challengeId } = await callFunction('passkey', { action: 'register-options' });
    const response = await startRegistration({ optionsJSON: options });
    await callFunction('passkey', { action: 'register-verify', challengeId, response, device: deviceLabel() });
    return { ok: true };
  } catch (err) {
    return { error: explain(err) };
  }
}

// Sign in: returns a one-time token the store turns into a session.
export async function signInWithPasskey() {
  try {
    const { options, challengeId } = await callFunction('passkey', { action: 'login-options' });
    const response = await startAuthentication({ optionsJSON: options });
    const { tokenHash } = await callFunction('passkey', { action: 'login-verify', challengeId, response });
    return { tokenHash };
  } catch (err) {
    return { error: explain(err) };
  }
}
