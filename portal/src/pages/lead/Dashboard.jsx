import { useNavigate } from 'react-router-dom';
import { CalendarOff, ClipboardList, TrendingUp, Users } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, getUser, inScope, taskStats, teamOf } from '../../lib/selectors';
import { timeAgo } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Button, Card, EmptyState, SectionTitle, Stagger } from '../../components/ui';
import { AttendanceCell, StatCard } from '../../components/bits';
import { greeting } from '../admin/Dashboard';

export default function LeadDashboard() {
  const { state, viewer } = useStore();
  const navigate = useNavigate();
  const team = teamOf(state, viewer.id);
  const rows = team.map((u) => ({ u, att: attendanceStats(state, u.id), ts: taskStats(state, u.id) }));
  const pcts = rows.map((r) => r.att.pct).filter((p) => p != null);
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const queue = state.submissions.filter((s) => s.verdict === 'pending' && s.userId !== viewer.id && inScope(state, viewer, s.userId));
  const leaves = state.leaves.filter((l) => l.status === 'pending' && inScope(state, viewer, l.userId));

  return (
    <>
      <PageHeader title={`${greeting()}, ${viewer.name.split(' ')[0]}`} sub="Here is how your team is doing." />
      <Stagger className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="My team" value={team.length} note="members you look after" icon={Users} onClick={() => navigate('/lead/team')} />
          <StatCard label="Team attendance" value={avg} note="average, verified by the admin" icon={TrendingUp} />
          <StatCard label="Work to review" value={queue.length} note="from your team" icon={ClipboardList} accent={queue.length > 0} onClick={() => navigate('/lead/tasks')} />
          <StatCard label="Leave requests" value={leaves.length} note="from your team" icon={CalendarOff} onClick={() => navigate('/lead/leaves')} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="flex flex-col gap-3 p-6">
            <SectionTitle title="My team" sub="Attendance and tasks passed" action={<Button variant="ghost" size="sm" onClick={() => navigate('/lead/team')}>Manage team</Button>} />
            {rows.length === 0 ? (
              <EmptyState icon={Users} title="No members yet" text="Add members from the My team page, or wait for the admin to assign some." />
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {rows.map(({ u, att, ts }) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <Avatar name={u.name} photo={u.photo} size={34} />
                    <span className="min-w-[120px] flex-1 text-sm font-medium">{u.name}</span>
                    <AttendanceCell pct={att.pct} />
                    <span className="w-16 text-right font-mono text-[13px] text-slate-600">{ts.pass}/{ts.assigned}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <SectionTitle title="Waiting for you" />
            {queue.length === 0 && leaves.length === 0 && <EmptyState icon={ClipboardList} title="All clear" text="Nothing from your team needs a decision right now." />}
            <ul className="flex flex-col divide-y divide-slate-100">
              {queue.slice(0, 4).map((s) => {
                const u = getUser(state, s.userId);
                const t = state.tasks.find((x) => x.id === s.taskId);
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => navigate('/lead/tasks')} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <Avatar name={u.name} photo={u.photo} size={30} />
                      <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{u.name}</span> submitted <span className="font-medium">{t?.title}</span><span className="block text-xs text-slate-500">{timeAgo(s.submittedAt)}</span></span>
                    </button>
                  </li>
                );
              })}
              {leaves.map((l) => {
                const u = getUser(state, l.userId);
                return (
                  <li key={l.id}>
                    <button type="button" onClick={() => navigate('/lead/leaves')} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <Avatar name={u.name} photo={u.photo} size={30} />
                      <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{u.name}</span> asked for leave<span className="block text-xs text-slate-500">{l.reason}</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
        <Card className="flex flex-col gap-3 p-6">
          <SectionTitle title="Announcements" action={<Button variant="ghost" size="sm" onClick={() => navigate('/lead/announcements')}>Post new</Button>} />
          <ul className="grid gap-3 md:grid-cols-3">
            {state.announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-1 line-clamp-3 text-[13px] text-slate-500">{a.message}</p>
                <p className="mt-2 text-xs text-slate-400">{timeAgo(a.postedAt)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </Stagger>
    </>
  );
}
