import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCheck, ChevronRight, Clock, Play, Square, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { currentSession, getUser, people, sessionState } from '../../lib/selectors';
import { fmtDate, fmtTime } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Badge, Button, Card, EmptyState, Field, SectionTitle, Stagger, cx, ease } from '../../components/ui';
import { CodeTiles, Countdown } from '../../components/bits';
import { useToast } from '../../components/Toasts';

export default function Attendance() {
  const { state, actions } = useStore();
  const toast = useToast();
  const cur = currentSession(state);
  const open = sessionState(cur) === 'open';
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [expanded, setExpanded] = useState(null);

  const checkins = cur ? state.attendance.filter((a) => a.sessionId === cur.id).sort((a, b) => a.markedAt.localeCompare(b.markedAt)) : [];
  const pending = checkins.filter((a) => a.status === 'pending').length;
  const past = [...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).filter((s) => !(open && s.id === cur.id));
  const total = people(state).length;

  const start = (e) => {
    e.preventDefault();
    const r = actions.startSession(title, Number(minutes));
    if (r.error) return toast(r.error, 'error');
    setTitle('');
    toast(`Session started. Show code ${r.code} in the room.`);
  };

  return (
    <>
      <PageHeader title="Attendance" sub="Only the admin runs attendance. Step 1: members type the code. Step 2: you verify who is really in the room." />
      <Stagger className="flex flex-col gap-5">
        <Card className="scanlines relative overflow-hidden border-brand-300/60 bg-ink-950 p-6 text-white shadow-[0_0_40px_-12px_rgba(62,230,200,0.35)] sm:p-8">
          <div className="tech-grid absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="animate-drift absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-600/40 blur-[80px]" aria-hidden="true" />
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key={cur.id} className="relative flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-signal">SHOW THIS CODE IN THE ROOM</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{cur.title}</p>
                  </div>
                  <Countdown until={cur.expiresAt} total={new Date(cur.expiresAt) - new Date(cur.startedAt)} />
                </div>
                <CodeTiles code={cur.code} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" icon={Clock} onClick={() => { actions.extendSession(cur.id, 5); toast('Added 5 more minutes.'); }}>+5 minutes</Button>
                  <Button variant="danger" size="sm" icon={Square} onClick={() => { actions.closeSession(cur.id); toast('Session closed. The code no longer works.'); }}>Close session</Button>
                </div>
              </motion.div>
            ) : (
              <motion.form key="start" onSubmit={start} className="relative flex flex-col gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease }}>
                <div>
                  <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-signal">NO SESSION OPEN</p>
                  <p className="mt-1 font-display text-2xl font-semibold">Start a session</p>
                  <p className="mt-1 text-sm text-slate-400">A new 6-character code is made each time.</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <Field label={<span className="text-slate-700">Session name</span>} className="min-w-[220px] flex-1">
                    <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly meet-up" />
                  </Field>
                  <Field label={<span className="text-slate-700">Code works for</span>}>
                    <select className="input w-40" value={minutes} onChange={(e) => setMinutes(e.target.value)}>
                      {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                    </select>
                  </Field>
                  <Button type="submit" size="lg" icon={Play}>Start and show code</Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
            <SectionTitle title={`Step 2: verify check-ins${cur ? ` · ${cur.title}` : ''}`} sub={`${checkins.length} of ${total} entered the code · ${pending} waiting for you`} />
            <Button variant="success" size="sm" icon={CheckCheck} disabled={!pending} onClick={() => { const r = actions.verifyAllPending(cur.id); toast(`Verified ${r.count} check-ins.`); }}>Verify all pending</Button>
          </div>
          {checkins.length === 0 ? (
            <EmptyState icon={Clock} title="No one has entered the code yet" text="Check-ins appear here live as members type the code." />
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              <AnimatePresence initial={false}>
                {checkins.map((a, i) => {
                  const u = getUser(state, a.userId);
                  return (
                    <motion.li key={a.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                      className={cx('flex flex-wrap items-center gap-3 px-5 py-3 transition-colors', a.status === 'pending' && 'bg-amber-50/40')}>
                      <Avatar name={u.name} photo={u.photo} size={36} />
                      <span className="flex min-w-[160px] flex-1 flex-col"><span className="font-semibold">{u.name}</span><span className="font-mono text-xs text-slate-500">{u.roll}</span></span>
                      <span className="w-20 text-[13px] text-slate-500">{fmtTime(a.markedAt)}</span>
                      <span className="w-24"><Badge tone={a.status} /></span>
                      <div className="flex gap-2">
                        {a.status !== 'verified' && <Button size="sm" variant="success" icon={Check} onClick={() => { actions.setCheckin(a.id, 'verified'); toast(`${u.name} verified.`); }}>Verify</Button>}
                        {a.status !== 'rejected' && <Button size="sm" variant="danger" icon={X} onClick={() => { actions.setCheckin(a.id, 'rejected'); toast(`${u.name} rejected and notified.`); }}>Reject</Button>}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Past sessions" sub="Click a session to see who was verified" />
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((s) => {
              const marks = state.attendance.filter((a) => a.sessionId === s.id);
              const ver = marks.filter((a) => a.status === 'verified');
              const isOpen = expanded === s.id;
              return (
                <li key={s.id} className="rounded-xl border border-slate-200">
                  <button type="button" onClick={() => setExpanded(isOpen ? null : s.id)} aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50">
                    <motion.span animate={{ rotate: isOpen ? 90 : 0 }}><ChevronRight className="h-4 w-4 text-slate-400" /></motion.span>
                    <span className="flex-1"><span className="font-semibold">{s.title}</span><span className="text-sm text-slate-500"> · {fmtDate(s.startedAt)}</span></span>
                    <span className="font-mono text-xs text-slate-500">{s.code}</span>
                    <span className="text-sm font-semibold">{ver.length} verified</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
                          {marks.length === 0 && <span className="text-sm text-slate-500">No check-ins.</span>}
                          {marks.map((a) => {
                            const u = getUser(state, a.userId);
                            return (
                              <span key={a.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-1.5 text-[13px]">
                                <Avatar name={u.name} size={22} /> {u.name} <Badge tone={a.status} />
                              </span>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Card>
      </Stagger>
    </>
  );
}
