import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, CircleCheck } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, currentSession, onApprovedLeave, sessionState } from '../../lib/selectors';
import { fmtDate, fmtTime } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Badge, Button, Card, EmptyState, Ring, SectionTitle, Stagger, cx, ease } from '../../components/ui';
import { Countdown } from '../../components/bits';

// Six boxes for the code, like a one-time-password field.
function CodeInput({ value, onChange, error, disabled }) {
  const refs = useRef([]);
  const chars = value.padEnd(6, ' ').slice(0, 6).split('');
  const setAt = (i, ch) => {
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = ch;
    onChange(arr.join('').replace(/\s+$/, ''));
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[i].trim()) setAt(i, ' ');
      else if (i > 0) { setAt(i - 1, ' '); refs.current[i - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };
  const onInput = (i, e) => {
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!v) return;
    if (v.length > 1) { // pasted the whole code
      onChange(v.slice(0, 6));
      refs.current[Math.min(5, v.length)]?.focus();
      return;
    }
    setAt(i, v);
    if (i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="flex gap-2 sm:gap-2.5" role="group" aria-label="Session code">
      {chars.map((ch, i) => (
        <motion.input key={i} ref={(el) => { refs.current[i] = el; }}
          aria-label={`Character ${i + 1}`} inputMode="text" autoCapitalize="characters" autoComplete="one-time-code" disabled={disabled}
          value={ch.trim()} onChange={(e) => onInput(i, e)} onKeyDown={(e) => onKey(i, e)} onFocus={(e) => e.target.select()}
          animate={ch.trim() ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.2 }}
          className={cx('h-14 w-11 rounded-xl border-2 bg-panel text-center font-mono text-2xl font-semibold uppercase text-slate-900 outline-none transition-colors sm:h-16 sm:w-13 sm:w-[52px]',
            error ? 'border-red-400' : ch.trim() ? 'border-brand-500' : 'border-slate-300 focus:border-brand-500')} />
      ))}
    </div>
  );
}

export default function MemberAttendance() {
  const { state, viewer, actions } = useStore();
  const cur = currentSession(state);
  const open = sessionState(cur) === 'open';
  const mark = cur ? state.attendance.find((a) => a.sessionId === cur.id && a.userId === viewer.id) : null;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);
  const stats = attendanceStats(state, viewer.id);
  const sessions = [...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).filter((s) => new Date(s.startedAt) >= new Date(new Date(viewer.joinedAt).setHours(0, 0, 0, 0)));

  useEffect(() => { setError(''); }, [code]);

  const submit = (e) => {
    e.preventDefault();
    if (code.length < 6) { setError('Enter all 6 characters.'); setShake((s) => s + 1); return; }
    const r = actions.markAttendance(code);
    if (r.error) { setError(r.error); setShake((s) => s + 1); }
  };

  return (
    <>
      <PageHeader title="Attendance" sub="Step 1: type the code shown in the room. Step 2: the admin verifies you." />
      <Stagger className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {!cur || !open ? (
              mark ? null : (
                <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState icon={CalendarCheck} title="No session is open right now" text="When a meeting starts, the admin opens a session and shows a code. Come back here to enter it." />
                </motion.div>
              )
            ) : null}
            {open && !mark && (
              <motion.form key="form" onSubmit={submit} className="flex flex-col gap-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, ease }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-brand-600">OPEN NOW</p>
                    <h2 className="font-display text-2xl font-semibold">{cur.title}</h2>
                  </div>
                  <div className="text-slate-700"><Countdown until={cur.expiresAt} total={new Date(cur.expiresAt) - new Date(cur.startedAt)} size={48} /></div>
                </div>
                <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
                  <CodeInput value={code} onChange={setCode} error={!!error} />
                </motion.div>
                <AnimatePresence>
                  {error && <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm font-medium text-red-600">{error}</motion.p>}
                </AnimatePresence>
                <Button type="submit" size="lg" className="self-start">Submit code</Button>
                <p className="text-xs text-slate-500">Demo hint: today&apos;s code is <span className="font-mono font-semibold text-slate-800">{cur.code}</span></p>
              </motion.form>
            )}
            {mark && cur && (
              <motion.div key="done" role="status" className="flex flex-col items-center gap-3 py-6 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }}>
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className={cx('flex h-16 w-16 items-center justify-center rounded-full', mark.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>
                  <CircleCheck className="h-9 w-9" />
                </motion.div>
                <h2 className="font-display text-xl font-semibold">{mark.status === 'verified' ? 'You are verified' : mark.status === 'rejected' ? 'Check-in rejected' : 'Code accepted'}</h2>
                <p className="max-w-sm text-sm text-slate-500">
                  {mark.status === 'pending' ? `You checked in to ${cur.title} at ${fmtTime(mark.markedAt)}. The admin will verify you shortly.` : mark.status === 'verified' ? `${cur.title} now counts toward your attendance.` : 'Talk to the admin if you were in the room.'}
                </p>
                <Badge tone={mark.status} dot />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        <Card className="flex flex-col items-center gap-3 p-6">
          <Ring value={stats.pct} size={140} stroke={12} label="attendance" />
          <p className="text-sm text-slate-600">{stats.verified} of {stats.held} sessions verified{stats.leave ? ` · ${stats.leave} on leave` : ''}</p>
          <p className="text-xs text-slate-500">Club minimum is 75%</p>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="My attendance history" />
          <ul className="mt-3 divide-y divide-slate-100">
            {sessions.map((s) => {
              const m = state.attendance.find((a) => a.sessionId === s.id && a.userId === viewer.id);
              const leave = onApprovedLeave(state, viewer.id, s.startedAt);
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span><span className="font-medium">{s.title}</span><span className="text-sm text-slate-500"> · {fmtDate(s.startedAt)}</span></span>
                  {m ? <Badge tone={m.status} /> : leave ? <Badge tone="leave" /> : sessionState(s) === 'open' ? <Badge tone="open" /> : <span className="text-sm text-slate-400">Absent</span>}
                </li>
              );
            })}
          </ul>
        </Card>
      </Stagger>
    </>
  );
}
