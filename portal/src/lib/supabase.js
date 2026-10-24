// Connection to the OSMIC Supabase project.
// The address and the public ("publishable"/anon) key are filled in automatically when GitHub builds
// the site. They are safe to be public: the database's security rules decide what each person may do.
// On your laptop, put them in portal/.env.local:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_KEY=your-publishable-or-anon-key
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

// Turn any Supabase error into a sentence the person can read.
export async function friendly(err) {
  if (!err) return 'Something went wrong. Please try again.';
  // Server function errors carry a JSON body like { error: "..." }.
  if (err.context && typeof err.context.json === 'function') {
    try {
      const body = await err.context.json();
      if (body?.error) return body.error;
    } catch { /* fall through */ }
  }
  const msg = err.message || String(err);
  if (/Invalid login credentials/i.test(msg)) return 'Incorrect email or password.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Could not reach the server. Check your internet connection.';
  if (/row-level security|permission denied/i.test(msg)) return "You don't have permission to do that.";
  if (/Email not confirmed/i.test(msg)) return 'Open the link in your email first to set your password.';
  return msg;
}

// Call one of the OSMIC server functions; throws a readable Error on failure.
export async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(await friendly(error));
  if (data?.error) throw new Error(data.error);
  return data;
}
