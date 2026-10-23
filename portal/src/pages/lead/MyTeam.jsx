import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserMinus, UserPlus, Users } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, taskStats, teamOf, unassigned } from '../../lib/selectors';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Button, Card, EmptyState, SectionTitle, Stagger } from '../../components/ui';
import { AttendanceCell, MemberProfile } from '../../components/bits';
import { useToast } from '../../components/Toasts';

export default function MyTeam() {
  const { state, viewer, actions } = useStore();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const team = teamOf(state, viewer.id);
  const free = unassigned(state);

  return (
    <>
      <PageHeader title="My team" sub="The members you look after. You check their tasks and leave; the admin handles attendance and new joiners." />
      <Stagger className="flex flex-col gap-5">
        <Card className="overflow-x-auto scrollbar-thin">
          <div className="p-5 pb-3"><SectionTitle title={`Your members · ${team.length}`} sub="Click a name to see their full record" /></div>
          {team.length === 0 ? (
            <EmptyState icon={Users} title="No members in your team yet" text="Add someone from the list below." />
          ) : (
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead><tr><th className="th">Member</th><th className="th">Attendance</th><th className="th">Tasks passed</th><th className="th">To review</th><th className="th" /></tr></thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {team.map((u, i) => {
                    const att = attendanceStats(state, u.id);
                    const ts = taskStats(state, u.id);
                    return (
                      <motion.tr key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, x: 40 }} className="hover:bg-slate-50/80">
                        <td className="td">
                          <button type="button" onClick={() => setProfile(u.id)} className="group flex items-center gap-3 text-left">
                            <Avatar name={u.name} photo={u.photo} size={36} />
                            <span className="flex flex-col"><span className="font-semibold group-hover:text-brand-600">{u.name}</span><span className="font-mono text-xs text-slate-500">{u.roll}</span></span>
                          </button>
                        </td>
                        <td className="td"><AttendanceCell pct={att.pct} /></td>
                        <td className="td font-mono text-[13px]">{ts.pass} / {ts.assigned}</td>
                        <td className="td font-mono text-[13px]">{ts.submitted}</td>
                        <td className="td text-right">
                          <Button size="sm" variant="danger" icon={UserMinus} onClick={() => { const r = actions.removeFromMyTeam(u.id); toast(r.error || `${r.name} removed from your team. The admin can give them a new lead.`, r.error ? 'error' : 'success'); }}>
                            Remove from team
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Add members to your team" sub="Approved members who are not in any team yet" />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {free.map((u) => (
                <motion.li key={u.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <Avatar name={u.name} photo={u.photo} size={36} />
                  <span className="flex min-w-0 flex-1 flex-col"><span className="truncate font-semibold">{u.name}</span><span className="font-mono text-xs text-slate-500">{u.roll}</span></span>
                  <Button size="sm" icon={UserPlus} onClick={() => { const r = actions.addToMyTeam(u.id); toast(r.error || `${r.name} added to your team.`, r.error ? 'error' : 'success'); }}>Add</Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {free.length === 0 && <p className="mt-2 text-sm text-slate-500">Everyone is already in a team.</p>}
        </Card>
      </Stagger>
      <MemberProfile userId={profile} onClose={() => setProfile(null)} />
    </>
  );
}
