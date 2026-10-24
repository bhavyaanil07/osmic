// Opened from the welcome / reset email: signs the person in with the one-time link,
// then lets them choose their password.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useStore } from '../../lib/store';
import { homePath } from '../../lib/selectors';
import { supabase } from '../../lib/supabase';
import { Button, Field, ease } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { useToast } from '../../components/Toasts';

export default function SetPassword() {
  const { viewer, actions } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('checking'); // checking | ready | error
  const [error, setError] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      if (tokenHash && (type === 'invite' || type === 'recovery')) {
        // Remove the one-time token from the address bar straight away.
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        const r = await actions.useEmailLink(tokenHash, type);
        if (r.error) { setError(r.error); setStatus('error'); return; }
        setStatus('ready');
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) setStatus('ready');
      else { setError('Open this page from the link in your email.'); setStatus('error'); }
    })();
  }, [actions]);

  const problem = pw.length > 0 && pw.length < 8 ? 'Use at least 8 characters.' : pw2 && pw !== pw2 ? "The passwords don't match." : '';

  const save = async (e) => {
    e.preventDefault();
    if (pw.length < 8 || pw !== pw2) return;
    setBusy(true);
    const r = await actions.setPassword(pw);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    toast('Password saved. Welcome to OSMIC!');
    const { data } = await supabase.auth.getUser();
    const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user?.id).maybeSingle();
    navigate(homePath(p?.role || viewer?.role || 'member'), { replace: true });
  };

  return (
    <div className="cyber-bg flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-panel p-7 shadow-lift">
        <Logo sub="CLUB PORTAL" />
        <div className="mt-8">
          {status === 'checking' && <p className="text-slate-600" role="status">Checking your link…</p>}
          {status === 'error' && (
            <div role="alert" className="flex flex-col gap-4">
              <h1 className="font-display text-2xl font-semibold">This link didn&apos;t work</h1>
              <p className="text-slate-600">{error}</p>
              <Button onClick={() => navigate('/login')}>Go to log in</Button>
            </div>
          )}
          {status === 'ready' && (
            <form onSubmit={save} className="flex flex-col gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><KeyRound className="h-6 w-6" aria-hidden="true" /></span>
              <h1 className="font-display text-2xl font-semibold">Choose your password</h1>
              <p className="-mt-2 text-sm text-slate-600">You&apos;ll use it with your email to log in.</p>
              <Field label="New password" error={pw.length > 0 && pw.length < 8 ? problem : ''}>
                <div className="relative">
                  <input className="input pr-12" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
                  <button type="button" onClick={() => setShow((x) => !x)} aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Type it again" error={pw2 && pw !== pw2 ? problem : ''}>
                <input className="input" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              </Field>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}
              <Button type="submit" size="lg" disabled={busy || pw.length < 8 || pw !== pw2}>{busy ? 'Saving…' : 'Save password'}</Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
