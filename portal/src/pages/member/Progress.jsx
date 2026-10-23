import { motion } from 'framer-motion';
import { CalendarCheck, CircleCheck, CircleX, Upload } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, taskStats } from '../../lib/selectors';
import { fmtDate } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Card, ProgressBar, Ring, SectionTitle, Stagger, AnimatedNumber, cx } from '../../components/ui';

export default function MemberProgress() {
  const { state, viewer } = useStore();
  const att = attendanceStats(state, viewer.id);
  const ts = taskStats(state, viewer.id);
  const reviewed = ts.pass + ts.fail;
  const leaves = state.leaves.filter((l) => l.userId === viewer.id && l.status === 'approved').length;

  // A simple timeline of what this member did, newest first.
  const events = [
    ...state.attendance.filter((a) => a.userId === viewer.id && a.status === 'verified').map((a) => {
      const s = state.sessions.find((x) => x.id === a.sessionId);
      return { at: a.markedAt, icon: CalendarCheck, tone: 'bg-brand-100 text-brand-700', text: `Attended ${s?.title}` };
    }),
    ...state.submissions.filter((s) => s.userId === viewer.id).flatMap((s) => {
      const t = state.tasks.find((x) => x.id === s.taskId);
      const out = [{ at: s.submittedAt, icon: Upload, tone: 'bg-slate-100 text-slate-700', text: `Submitted ${t?.title}` }];
      if (s.verdict === 'pass') out.push({ at: s.submittedAt.replace(/T(\d\d)/, (m, h) => `T${String(Math.min(23, +h + 1)).padStart(2, '0')}`), icon: CircleCheck, tone: 'bg-emerald-100 text-emerald-700', text: `Passed ${t?.title}` });
      if (s.verdict === 'fail') out.push({ at: s.submittedAt.replace(/T(\d\d)/, (m, h) => `T${String(Math.min(23, +h + 1)).padStart(2, '0')}`), icon: CircleX, tone: 'bg-red-100 text-red-700', text: `Did not pass ${t?.title}` });
      return out;
    }),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const bars = [
    { label: 'Passed', value: ts.pass, tone: 'green' },
    { label: 'Waiting for review', value: ts.submitted, tone: 'brand' },
    { label: 'Not passed', value: ts.fail, tone: 'red' },
    { label: 'Still to do', value: ts.todo + ts.missed, tone: 'amber' },
  ];

  return (
    <>
      <PageHeader title="My progress" sub="Your record since you joined OSMIC." />
      <Stagger className="flex flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="flex flex-col items-center gap-3 p-6">
            <Ring value={att.pct} size={150} stroke={12} label="attendance" />
            <p className="text-sm text-slate-600">{att.verified} of {att.held} sessions verified</p>
            <p className={cx('text-xs font-medium', att.pct != null && att.pct < 75 ? 'text-amber-700' : 'text-slate-500')}>
              {att.pct == null ? 'No sessions yet' : att.pct >= 75 ? 'Above the 75% club minimum' : 'Below the 75% club minimum'}
            </p>
          </Card>
          <Card className="flex flex-col gap-4 p-6">
            <SectionTitle title="Tasks" sub={`${ts.assigned} assigned to you`} />
            {bars.map((b) => (
              <div key={b.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-600">{b.label}</span><span className="font-semibold">{b.value}</span></div>
                <ProgressBar value={ts.assigned ? (b.value / ts.assigned) * 100 : 0} tone={b.tone} />
              </div>
            ))}
          </Card>
          <Card className="grid grid-cols-2 gap-3 p-6">
            {[['Pass rate', reviewed ? Math.round((ts.pass / reviewed) * 100) : null, '%'], ['Sessions attended', att.verified, ''], ['Approved leave', leaves, ''], ['Tasks passed', ts.pass, '']].map(([k, v, s]) => (
              <div key={k} className="flex flex-col justify-center rounded-xl bg-slate-50 p-4">
                <AnimatedNumber value={v} suffix={s} className="font-display text-3xl font-bold" />
                <span className="text-xs font-medium text-slate-500">{k}</span>
              </div>
            ))}
          </Card>
        </div>
        <Card className="p-6">
          <SectionTitle title="Activity" sub="Everything you have done in the club" />
          <ol className="relative mt-5 flex flex-col gap-4 pl-2">
            <span className="absolute bottom-2 left-[25px] top-2 w-px bg-slate-200" aria-hidden="true" />
            {events.map((e, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + Math.min(i, 10) * 0.05 } }} className="relative flex items-center gap-3">
                <span className={cx('relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-panel', e.tone)}><e.icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="flex-1 text-sm">{e.text}</span>
                <span className="text-xs text-slate-500">{fmtDate(e.at)}</span>
              </motion.li>
            ))}
            {events.length === 0 && <li className="text-sm text-slate-500">Nothing yet. Your first session or task will show up here.</li>}
          </ol>
        </Card>
      </Stagger>
    </>
  );
}
