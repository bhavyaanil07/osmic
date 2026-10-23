import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useStore } from '../../lib/store';
import { homePath } from '../../lib/selectors';
import { DEMO_PASSWORD } from '../../lib/demoData';
import { Button, Field, ease } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { useToast } from '../../components/Toasts';

const TAGLINE = 'From Ideas to Impact.';
// Online: the GitHub Pages website. On your own computer: the website served on port 8000.
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const WEBSITE_URL = IS_LOCAL ? 'http://localhost:8000/' : '../';

function Typed({ text }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => x + 1), n === 0 ? 2000 : 60);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <span>
      {text.slice(0, n)}
      <span className="ml-1 inline-block w-[2px] animate-blink bg-brand-600 align-[-0.12em]" style={{ height: '0.9em' }} aria-hidden="true" />
    </span>
  );
}

export function AuthBackdrop({ children }) {
  return (
    <div className="scanlines relative flex flex-col justify-between gap-12 overflow-hidden border-b border-brand-200/50 bg-ink-950 p-8 text-slate-700 sm:p-12 lg:border-b-0 lg:border-r">
      <div className="tech-grid absolute inset-0" aria-hidden="true" />
      <div className="animate-drift absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand-600/25 blur-[90px]" aria-hidden="true" />
      <div className="animate-drift-slow absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-signal/25 blur-[100px]" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}

// Slow flowing lines at the bottom of the login panel.
const WAVES = [
  { d: 'M0 70 C 120 20, 240 120, 360 70 S 600 20, 720 70', color: '#3EE6C8', width: 1.5, cls: 'animate-flow', dash: '6 10', o: 0.55 },
  { d: 'M0 95 C 140 50, 260 140, 400 95 S 620 50, 720 95', color: '#C9D6D8', width: 1.25, cls: 'animate-flow-slow', dash: '2 8', o: 0.5 },
  { d: 'M0 45 C 100 90, 280 0, 420 45 S 640 90, 720 45', color: '#F2B544', width: 2, cls: 'animate-flow-slow', dash: '14 12', o: 0.8 },
];

function FlowLines() {
  return (
    <svg viewBox="0 0 720 140" preserveAspectRatio="none" className="h-28 w-full" aria-hidden="true">
      {WAVES.map((w, i) => (
        <motion.path key={i} d={w.d} fill="none" stroke={w.color} strokeWidth={w.width} strokeDasharray={w.dash} strokeLinecap="round"
          className={w.cls} initial={{ opacity: 0, y: 12 }} animate={{ opacity: w.o, y: 0 }} transition={{ duration: 1.6, delay: 0.4 + i * 0.25, ease }} />
      ))}
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} r="3.5" fill="#3EE6C8"
          initial={{ cx: -10, cy: 70, opacity: 0 }}
          animate={{ cx: [-10, 730], cy: [70, 40, 95, 60, 70], opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: 9, repeat: Infinity, delay: 1.5 + i * 3, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 6px #C9D6D8)' }} />
      ))}
    </svg>
  );
}

export default function Login() {
  const { actions } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);

  const go = (user) => navigate(location.state?.from && location.state.from.startsWith(homePath(user.role)) ? location.state.from : homePath(user.role));

  const onSubmit = (e) => {
    e.preventDefault();
    const res = actions.login(email, password);
    if (res.error) { setError(res.error); setShake((s) => s + 1); return; }
    go(res.user);
  };

  const demo = [
    { label: 'Admin', id: 'u0', note: 'Runs the club' },
    { label: 'Club lead', id: 'u1', note: 'Rahul Nair' },
    { label: 'Member', id: 'u3', note: 'Ananya Menon' },
  ];

  return (
    <div className="cyber-bg grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <AuthBackdrop>
        <div className="flex min-h-[260px] flex-col justify-between gap-16 lg:min-h-[calc(100vh-96px)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Logo sub="CLUB PORTAL" />
            <a href={WEBSITE_URL} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-slate-700 transition hover:text-brand-600">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> OSMIC website
            </a>
          </div>
          <div className="max-w-xl">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 1, ease }}
              className="text-[15px] text-slate-700">Amrita Vishwa Vidyapeetham, Amritapuri</motion.p>
            <h1 className="mt-4">
              <span className="sr-only">OSMIC</span>
              <motion.span aria-hidden="true" className="inline-block whitespace-nowrap font-display text-6xl font-extrabold leading-[0.95] text-slate-900 sm:text-8xl"
                initial={{ letterSpacing: '-0.34em' }} animate={{ letterSpacing: '0.08em' }} transition={{ duration: 2, delay: 0.75, ease }}>
                {'OSMIC'.split('').map((ch, i) => (
                  <motion.span key={i} className="inline-block transition-colors duration-300 hover:text-brand-600"
                    style={{ textShadow: '0 0 60px rgba(62, 230, 200, 0.35)' }}
                    initial={{ opacity: 0, filter: 'blur(16px)', y: '0.3em', scale: 0.86 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 }}
                    transition={{ duration: 1.3, delay: 0.15 + i * 0.09, ease }}>
                    {ch}
                  </motion.span>
                ))}
              </motion.span>
            </h1>
            <motion.div aria-hidden="true" className="mt-6 h-0.5 w-[min(420px,80%)] origin-left bg-gradient-to-r from-transparent via-brand-600 to-signal"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, delay: 1.6, ease }} />
            <p className="mt-6 min-h-[1.4em] font-display text-xl font-normal text-slate-900 sm:text-2xl"><Typed text={TAGLINE} /></p>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: 0.8, ease }}
              className="mt-4 max-w-md text-[16px] leading-relaxed text-slate-500">
              Attendance, tasks, leave and announcements for every OSMIC member, in one place.
            </motion.p>
          </div>
          <div className="-mx-8 hidden sm:-mx-12 lg:block"><FlowLines /></div>
        </div>
      </AuthBackdrop>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div className="w-full max-w-[400px]" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <h2 className="font-display text-3xl font-semibold">Log in</h2>
          <p className="mt-1.5 text-slate-500">Use the email you applied with.</p>

          <motion.form key={shake} onSubmit={onSubmit} className="mt-8 flex flex-col gap-4"
            animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
            <Field label="Email">
              <input className="input" type="email" autoComplete="email" required value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@am.students.amrita.edu" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input className="input pr-12" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Your password" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <div className="-mt-1 flex justify-end">
              <button type="button" onClick={() => toast('In the real site this emails you a reset link.', 'email')} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</motion.p>
              )}
            </AnimatePresence>
            <Button type="submit" size="lg" className="group w-full">
              Log in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </motion.form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Not a member yet?{' '}
            <Link to="/apply" className="font-semibold text-brand-600 hover:text-brand-700">Apply to join</Link>
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-rose-300 bg-panel/60 p-4">
            <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500">DEMO · VIEW THE PORTAL AS</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {demo.map((d, i) => (
                <motion.button key={d.id} type="button"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { const r = actions.loginAs(d.id); go(r.user); }}
                  className="flex min-h-[56px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-panel px-2 py-2 shadow-sm transition-shadow hover:shadow-lift">
                  <span className="text-sm font-semibold text-slate-900">{d.label}</span>
                  <span className="text-[11px] text-slate-500">{d.note}</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Or log in with any demo email and <span className="font-mono font-semibold text-slate-700">{DEMO_PASSWORD}</span></span>
              <button type="button" onClick={() => { actions.resetDemo(); toast('Demo data reset.'); }} className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
