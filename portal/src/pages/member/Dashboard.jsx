import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CircleCheck, ClipboardList } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, currentSession, getUser, sessionState, taskStats, taskStatus } from '../../lib/selectors';
import { fmtDate, relDay, timeAgo } from '../../lib/dates';
import { Badge, Button, Card, EmptyState, Ring, SectionTitle, Stagger, AnimatedNumber, cx, ease } from '../../components/ui';
import { greeting } from '../admin/Dashboard';

export default function MemberDashboard() {
  const { state, viewer } = useStore();
  const navigate = useNavigate();
  const lead = viewer.leadId ? getUser(state, viewer.leadId) : null;
  const cur = currentSession(state);
  const open = sessionState(cur) === 'open';
  const mark = cur ? state.attendance.find((a) => a.sessionId === cur.id && a.userId === viewer.id) : null;
  const att = attendanceStats(state, viewer.id);
  const ts = taskStats(state, viewer.id);
  const upcoming = state.tasks
    .filter((t) => t.assignees.includes(viewer.id) && taskStatus(state, t, viewer.id) === 'not_submitted')
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const notes = state.notifications.filter((n) => n.userId === viewer.id).slice(0, 4);

  return (
    <Stagger className="flex flex-col gap-5">
      <motion.section variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
        className="scanlines relative overflow-hidden rounded-3xl border border-brand-300/60 bg-ink-950 p-6 text-white shadow-[0_0_40px_-12px_rgba(62,230,200,0.35)] sm:p-8">
        <div className="tech-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="animate-drift absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-600/50 blur-[90px]" aria-hidden="true" />
        <div className="animate-drift-slow absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-signal/20 blur-[90px]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[12px] font-medium text-signal">{greeting().toLowerCase()} ·</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Hi, {viewer.name.split(' ')[0]}</h1>
            <p className="mt-2 text-slate-400">Your club lead: <span className="font-medium text-white">{lead ? lead.name : 'not assigned yet'}</span></p>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-slate-400">{open ? 'SESSION OPEN NOW' : 'NEXT SESSION'}</p>
            <p className="mt-1 font-display text-lg font-semibold">{open ? cur.title : 'No session open'}</p>
            {open && !mark && (
              <Button className="mt-3 w-full" onClick={() => navigate('/member/attendance')}>Mark attendance <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
            )}
            {open && mark && <div className="mt-2 flex items-center gap-2 text-sm text-slate-700"><CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Checked in · <Badge tone={mark.status} /></div>}
            {!open && <p className="mt-1 text-sm text-slate-400">The admin opens a session at the start of each meeting.</p>}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover className="flex items-center gap-4 p-5">
          <Ring value={att.pct} size={84} stroke={8} />
          <div><p className="text-[13px] font-semibold text-slate-500">Attendance</p><p className="text-xs text-slate-500">{att.verified} of {att.held} sessions</p></div>
        </Card>
        <Card hover className="flex flex-col gap-1 p-5">
          <p className="text-[13px] font-semibold text-slate-500">Tasks to submit</p>
          <AnimatedNumber value={ts.todo} className="font-display text-[34px] font-bold leading-none" />
          <p className="truncate text-xs text-slate-500">{upcoming[0] ? `Next: ${upcoming[0].title}` : 'Nothing due'}</p>
        </Card>
        <Card hover className="flex flex-col gap-1 p-5">
          <p className="text-[13px] font-semibold text-slate-500">Tasks passed</p>
          <p className="font-display text-[34px] font-bold leading-none"><AnimatedNumber value={ts.pass} /><span className="text-xl text-slate-400"> / {ts.pass + ts.fail}</span></p>
          <p className="text-xs text-slate-500">{ts.submitted} waiting for review</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col gap-3 p-6">
          <SectionTitle title="Coming up" sub="Tasks you still need to submit" action={<Button variant="ghost" size="sm" onClick={() => navigate('/member/tasks')}>All tasks</Button>} />
          {upcoming.length === 0 ? <EmptyState icon={ClipboardList} title="You are all caught up" /> : (
            <ul className="flex flex-col gap-2">
              {upcoming.slice(0, 4).map((t, i) => {
                const soon = relDay(t.deadline);
                const urgent = ['today', 'tomorrow'].includes(soon);
                return (
                  <motion.li key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.06 } }}>
                    <button type="button" onClick={() => navigate('/member/tasks')} className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                      <span className={cx('flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-center leading-none', urgent ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')}>
                        <span className="text-[10px] font-semibold uppercase">{fmtDate(t.deadline).split(' ')[0]}</span>
                        <span className="font-display text-lg font-bold">{fmtDate(t.deadline).split(' ')[1]}</span>
                      </span>
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium">{t.title}</span><span className="text-xs text-slate-500">Due {soon}</span></span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <SectionTitle title="Notifications" />
          <ul className="flex flex-col divide-y divide-slate-100">
            {notes.length === 0 && <li className="py-3 text-sm text-slate-500">Nothing new.</li>}
            {notes.map((n) => (
              <li key={n.id} className="flex gap-3 py-2.5">
                <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-200' : 'bg-brand-500')} aria-hidden="true" />
                <span className="flex flex-col"><span className="text-sm">{n.text}</span><span className="text-xs text-slate-500">{timeAgo(n.at)}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-6">
        <SectionTitle title="Announcements" />
        <ul className="grid gap-3 md:grid-cols-3">
          {state.announcements.slice(0, 3).map((a, i) => (
            <motion.li key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.07 } }} className="rounded-xl border border-slate-200 bg-gradient-to-b from-panel to-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{a.title}</p>
                {Date.now() - new Date(a.postedAt).getTime() < 2 * 864e5 && <span className="rounded-full bg-signal px-2 py-0.5 text-[10px] font-bold text-ink-950 shadow-glow-pink">NEW</span>}
              </div>
              <p className="mt-1 text-[13px] text-slate-600">{a.message}</p>
              <p className="mt-2 text-xs text-slate-400">{timeAgo(a.postedAt)}</p>
            </motion.li>
          ))}
        </ul>
      </Card>
    </Stagger>
  );
}
