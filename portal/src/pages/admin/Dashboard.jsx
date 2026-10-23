import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarOff, ClipboardList, Mail, UserPlus, Users } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, currentSession, people, sessionState, unassigned } from '../../lib/selectors';
import { fmtDate, timeAgo } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Button, Card, EmptyState, SectionTitle, Stagger } from '../../components/ui';
import { AttendanceCell, CodeTiles, Countdown, StatCard } from '../../components/bits';

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function AdminDashboard() {
  const { state } = useStore();
  const navigate = useNavigate();
  const cur = currentSession(state);
  const open = sessionState(cur) === 'open';
  const checkins = cur ? state.attendance.filter((a) => a.sessionId === cur.id) : [];
  const pendingCheckins = checkins.filter((a) => a.status === 'pending').length;
  const pendingApps = state.applications.filter((a) => a.status === 'pending').length;
  const pendingSubs = state.submissions.filter((s) => s.verdict === 'pending').length;
  const pendingLeaves = state.leaves.filter((l) => l.status === 'pending').length;
  const all = people(state);
  const low = all
    .map((u) => ({ u, pct: attendanceStats(state, u.id).pct }))
    .filter((x) => x.pct != null)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  return (
    <>
      <PageHeader title={`${greeting()}, Admin`} sub={`Here is what needs your attention · ${fmtDate(new Date().toISOString())}`} />
      <Stagger className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="New applications" value={pendingApps} note="waiting for your decision" icon={UserPlus} accent={pendingApps > 0} onClick={() => navigate('/admin/applications')} />
          <StatCard label="Members" value={all.length} note={`${unassigned(state).length} without a club lead`} icon={Users} onClick={() => navigate('/admin/teams')} />
          <StatCard label="Check-ins to verify" value={pendingCheckins} note={cur?.title} icon={CalendarCheck} onClick={() => navigate('/admin/attendance')} />
          <StatCard label="Work to review" value={pendingSubs} note="task submissions" icon={ClipboardList} onClick={() => navigate('/admin/tasks')} />
          <StatCard label="Leave requests" value={pendingLeaves} note="pending" icon={CalendarOff} onClick={() => navigate('/admin/leaves')} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="scanlines relative overflow-hidden border-brand-300/60 bg-ink-950 p-6 text-white shadow-[0_0_40px_-12px_rgba(62,230,200,0.35)]">
            <div className="tech-grid absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-signal">{open ? 'LIVE SESSION' : 'LAST SESSION'}</p>
                  <p className="mt-1 font-display text-xl font-semibold">{cur ? cur.title : 'No sessions yet'}</p>
                </div>
                {open && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                    Open
                  </span>
                )}
              </div>
              {cur && open ? (
                <div className="flex flex-wrap items-center gap-6">
                  <CodeTiles code={cur.code} />
                  <Countdown until={cur.expiresAt} total={new Date(cur.expiresAt) - new Date(cur.startedAt)} />
                </div>
              ) : (
                <p className="text-sm text-slate-400">No session is open. Start one when the meeting begins.</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-sm text-slate-700">{checkins.length} entered the code · {checkins.filter((a) => a.status === 'verified').length} verified · {pendingCheckins} waiting</span>
                <Button size="sm" onClick={() => navigate('/admin/attendance')}>{open ? 'Verify check-ins' : 'Start a session'}</Button>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-6">
            <SectionTitle title="Emails sent automatically" sub="Welcome links, task alerts, results and leave decisions" />
            {state.outbox.length === 0 ? (
              <EmptyState icon={Mail} title="No emails yet" text="Approve an application or assign a task and the email shows up here." />
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {state.outbox.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Mail className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.subject}</span>
                      <span className="block truncate text-xs text-slate-500">to {m.to} · {timeAgo(m.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="flex flex-col gap-3 p-6">
            <SectionTitle title="Lowest attendance" sub="Members who may need a nudge" action={<Button variant="ghost" size="sm" onClick={() => navigate('/admin/members')}>All members</Button>} />
            <ul className="flex flex-col divide-y divide-slate-100">
              {low.map(({ u, pct }) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={u.name} photo={u.photo} size={32} />
                  <span className="flex-1 text-sm font-medium">{u.name}</span>
                  <AttendanceCell pct={pct} />
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <SectionTitle title="Latest announcements" action={<Button variant="ghost" size="sm" onClick={() => navigate('/admin/announcements')}>Post new</Button>} />
            <ul className="flex flex-col divide-y divide-slate-100">
              {state.announcements.slice(0, 3).map((a) => (
                <li key={a.id} className="py-2.5">
                  <div className="flex justify-between gap-3"><span className="text-sm font-semibold">{a.title}</span><span className="shrink-0 text-xs text-slate-500">{timeAgo(a.postedAt)}</span></div>
                  <p className="line-clamp-2 text-[13px] text-slate-500">{a.message}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Stagger>
    </>
  );
}
