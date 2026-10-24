// Shared helpers for the OSMIC server functions.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';

export const PORTAL_URL = (Deno.env.get('PORTAL_URL') ?? 'https://bhavyaanil07.github.io/osmic/portal/').replace(/#.*$/, '');

// Websites allowed to call these functions (the live portal and your laptop).
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://bhavyaanil07.github.io,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);

export function originOf(req: Request): string | null {
  const o = req.headers.get('origin');
  return o && ALLOWED_ORIGINS.includes(o) ? o : null;
}

export function cors(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': originOf(req) ?? ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });
}

// A friendly error the website can show as-is.
export class UserError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// Wraps a handler: answers the browser's CORS check, turns errors into JSON.
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
    if (req.method !== 'POST') return json(req, { error: 'Use POST.' }, 405);
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof UserError) return json(req, { error: err.message }, err.status);
      console.error(err);
      return json(req, { error: 'Something went wrong on the server. Please try again.' }, 500);
    }
  });
}

// Full-access client for the server (never sent to the browser).
export function admin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SECRET_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or service role key');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Profile = { id: string; name: string; email: string; role: 'admin' | 'lead' | 'member'; active: boolean; lead_id: string | null };

// Who is calling? Returns their profile, or null if not signed in.
export async function caller(req: Request, db: SupabaseClient): Promise<Profile | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: p } = await db.from('profiles').select('id, name, email, role, active, lead_id').eq('id', data.user.id).maybeSingle();
  return p && p.active ? (p as Profile) : null;
}

export async function requireAdmin(req: Request, db: SupabaseClient): Promise<Profile> {
  const me = await caller(req, db);
  if (!me || me.role !== 'admin') throw new UserError('Only the admin can do this.', 403);
  return me;
}

// A sign-in link the portal understands: it opens the Set password page.
export function portalLink(tokenHash: string, type: 'invite' | 'recovery'): string {
  return `${PORTAL_URL}?token_hash=${encodeURIComponent(tokenHash)}&type=${type}#/set-password`;
}

export const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
