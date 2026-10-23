// Larger shared pieces: stat cards, tabs, session code tiles, countdown,
// and the member profile popup.
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../lib/store';
import { attendanceStats, getUser, latestSubmission, taskStats, taskStatus } from '../lib/selectors';
import { fmtDate, fmtRange } from '../lib/dates';
import { AnimatedNumber, Avatar, Badge, Card, Modal, ProgressBar, Ring, cx, ease, useNow } from './ui';

export function StatCard({ label, value, note, icon: Icon, onClick, accent = false }) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Card hover={!!onClick} className={cx('p-0', accent && 'border-rose-300')}>
      <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="flex w-full flex-col gap-1 p-5 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-slate-500">{label}</span>
          {Icon && (
            <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', accent ? 'bg-signal text-ink-950 shadow-glow-pink' : 'bg-slate-100 text-brand-600')}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
        <AnimatedNumber value={value} className="gradient-text font-display text-[36px] font-bold leading-none" />
        {note && <span className="truncate text-xs text-slate-500">{note}</span>}
      </Tag>
    </Card>
  );
}

export function Tabs({ tabs, value, onChange, id }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('relative min-h-[36px] rounded-lg px-3.5 text-[13px] font-semibold transition-colors', value === t.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800')}>
          {value === t.value && (
            <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-lg bg-panel shadow-sm" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />
          )}
          <span className="relative">{t.label}{t.count != null && <span className="ml-1.5 text-slate-400">{t.count}</span>}</span>
        </button>
      ))}
    </div>
  );
}

// Big monospace code, each character flips in when the code changes.
export function CodeTiles({ code, size = 'lg', dark = true }) {
  const big = size === 'lg';
  return (
    <div className="flex gap-1.5 sm:gap-2" aria-label={`Session code ${code.split('').join(' ')}`}>
      {code.split('').map((ch, i) => (
        <div key={i} className={cx('relative overflow-hidden rounded-xl', big ? 'h-16 w-12 sm:h-[72px] sm:w-14' : 'h-12 w-10', dark ? 'bg-ink-950/70 text-slate-900 ring-1 ring-inset ring-brand-300' : 'bg-panel text-slate-900 ring-1 ring-slate-200')}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={code + i}
              initial={{ rotateX: -90, opacity: 0, y: -10 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} exit={{ rotateX: 90, opacity: 0, y: 10 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease }}
              className={cx('absolute inset-0 flex items-center justify-center font-mono font-semibold', big ? 'text-3xl sm:text-4xl' : 'text-2xl')}>
              {ch}
            </motion.span>
          </AnimatePresence>
          <div className="absolute inset-x-0 top-1/2 h-px bg-black/25" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

// Shrinking ring + "12:34 left".
export function Countdown({ until, total = 15 * 60000, size = 56 }) {
  const now = useNow(1000);
  const left = Math.max(0, new Date(until).getTime() - now);
  const mm = Math.floor(left / 60000);
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, left / total);
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={left < 120000 ? '#F2B544' : '#3EE6C8'} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div className="flex flex-col">
        <span className="font-mono text-xl font-semibold tabular-nums">{mm}:{ss}</span>
        <span className="text-xs opacity-70">left to enter the code</span>
      </div>
    </div>
  );
}

// Popup with everything about one member: contact, attendance, tasks, leave.
export function MemberProfile({ userId, onClose }) {
  const { state } = useStore();
  const u = userId ? getUser(state, userId) : null;
  const open = !!u;
  const att = u ? attendanceStats(state, u.id) : null;
  const ts = u ? taskStats(state, u.id) : null;
  const lead = u?.leadId ? getUser(state, u.leadId) : null;
  const tasks = u ? state.tasks.filter((t) => t.assignees.includes(u.id)) : [];
  const leaves = u ? state.leaves.filter((l) => l.userId === u.id) : [];
  const sessions = u ? [...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)) : [];

  return (
    <Modal open={open} onClose={onClose} title="Member profile" width={640}>
      {u && (
        <div className="scrollbar-thin -mr-2 flex max-h-[72vh] flex-col gap-5 overflow-y-auto pr-2">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={u.name} photo={u.photo} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-xl font-semibold">{u.name}</p>
                <Badge tone={u.role} />
                {!u.active && <Badge tone="inactive" />}
              </div>
              <p className="font-mono text-[13px] text-slate-600">{u.roll}</p>
              <p className="text-[13px] text-slate-500">
                {u.role === 'member' ? (lead ? `Club lead: ${lead.name}` : 'No club lead yet') : 'Reports to the admin'} · Joined {fmtDate(u.joinedAt)}
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div><p className="text-xs font-semibold text-slate-500">Email</p><p className="truncate">{u.email}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Mobile</p><p>{u.mobile}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">WhatsApp</p><p>{u.whatsapp}</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-1">
              <Ring value={att.pct} size={112} label="attendance" />
              <span className="text-xs text-slate-500">{att.verified} of {att.held} sessions{att.leave ? ` · ${att.leave} on leave` : ''}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['Assigned', ts.assigned], ['Passed', ts.pass], ['Failed', ts.fail], ['To review', ts.submitted]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500">{k}</p>
                  <AnimatedNumber value={v} className="font-display text-2xl font-bold" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Tasks</p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {tasks.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No tasks yet.</li>}
              {tasks.map((t) => {
                const s = taskStatus(state, t, u.id);
                const sub = latestSubmission(state, t.id, u.id);
                return (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1"><span className="font-medium">{t.title}</span><span className="text-slate-500"> · due {fmtDate(t.deadline)}</span>
                      {sub?.comment && <span className="block text-xs text-slate-500">“{sub.comment}”</span>}</span>
                    <Badge tone={s}>{s === 'submitted' ? 'To review' : undefined}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">Attendance history</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {sessions.map((s) => {
                  const m = state.attendance.find((a) => a.sessionId === s.id && a.userId === u.id);
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                      <span><span className="font-medium">{s.title}</span><span className="text-slate-500"> · {fmtDate(s.startedAt)}</span></span>
                      {m ? <Badge tone={m.status} /> : <span className="text-xs text-slate-400">Absent</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Leave history</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {leaves.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No leave taken.</li>}
                {leaves.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                    <span className="min-w-0"><span className="font-medium">{fmtRange(l.from, l.to)}</span><span className="block truncate text-xs text-slate-500">{l.reason}</span></span>
                    <Badge tone={l.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function AttendanceCell({ pct }) {
  return (
    <div className="flex items-center gap-2.5">
      <ProgressBar value={pct ?? 0} tone={pct == null || pct >= 75 ? 'brand' : 'amber'} className="w-20" />
      <span className={cx('text-[13px] font-semibold tabular-nums', pct != null && pct < 75 && 'text-amber-700')}>{pct == null ? '–' : `${pct}%`}</span>
    </div>
  );
}
