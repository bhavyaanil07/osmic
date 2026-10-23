import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useStore } from '../../lib/store';
import { attendanceStats, leadsOf, taskStats } from '../../lib/selectors';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Badge, Button, Card, cx } from '../../components/ui';
import { AttendanceCell, MemberProfile, Tabs } from '../../components/bits';
import { useToast } from '../../components/Toasts';

export default function Members() {
  const { state, actions } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [profile, setProfile] = useState(null);
  const leads = leadsOf(state);

  const rows = useMemo(() => state.users
    .filter((u) => u.role !== 'admin')
    .filter((u) => filter === 'all' || (filter === 'inactive' ? !u.active : u.active && u.role === filter))
    .filter((u) => !q || `${u.name} ${u.roll} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
    .map((u) => ({ u, att: attendanceStats(state, u.id), ts: taskStats(state, u.id) })), [state, q, filter]);

  const changeLead = (u, leadId) => {
    const r = actions.setLead(u.id, leadId);
    toast(r.lead ? `${r.name} now reports to ${r.lead}.` : `${r.name} no longer has a club lead.`);
  };
  const toggleRole = (u) => {
    const r = actions.toggleLeadRole(u.id);
    toast(r.promoted ? `${r.name} is now a club lead.` : `${r.name} is a member again.${r.freed ? ` ${r.freed} members need a new lead.` : ''}`);
  };

  return (
    <>
      <PageHeader title="Members" sub="Everyone in the club, their club lead and progress. Click a name for the full profile." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs id="members" value={filter} onChange={setFilter} tabs={[
          { value: 'all', label: 'All' }, { value: 'lead', label: 'Club leads' }, { value: 'member', label: 'Members' }, { value: 'inactive', label: 'Inactive' },
        ]} />
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input className="input pl-9" placeholder="Search name, roll no or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <Card className="overflow-x-auto scrollbar-thin" initial="hidden" animate="show">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr><th className="th">Member</th><th className="th">Role</th><th className="th">Club lead</th><th className="th">Attendance</th><th className="th">Tasks passed</th><th className="th text-right">Actions</th></tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map(({ u, att, ts }, i) => (
                <motion.tr key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.03 } }} exit={{ opacity: 0 }}
                  className={cx('transition-colors hover:bg-slate-50/80', !u.active && 'opacity-60')}>
                  <td className="td">
                    <button type="button" onClick={() => setProfile(u.id)} className="group flex items-center gap-3 text-left">
                      <Avatar name={u.name} photo={u.photo} size={36} />
                      <span className="flex flex-col">
                        <span className="font-semibold group-hover:text-brand-600">{u.name}</span>
                        <span className="font-mono text-xs text-slate-500">{u.roll}</span>
                      </span>
                    </button>
                  </td>
                  <td className="td"><Badge tone={u.role} /></td>
                  <td className="td">
                    {u.role === 'lead' ? <span className="text-[13px] text-slate-500">Reports to admin</span> : (
                      <select aria-label={`Club lead for ${u.name}`} className={cx('input min-h-[36px] w-44 py-1.5', !u.leadId && 'border-amber-300 bg-amber-50')} value={u.leadId || ''} onChange={(e) => changeLead(u, e.target.value)}>
                        <option value="">Unassigned</option>
                        {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="td"><AttendanceCell pct={att.pct} /></td>
                  <td className="td font-mono text-[13px]">{ts.pass} / {ts.assigned}</td>
                  <td className="td">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => toggleRole(u)}>{u.role === 'lead' ? 'Remove lead' : 'Make lead'}</Button>
                      <Button size="sm" variant="ghost" onClick={() => { actions.setActive(u.id, !u.active); toast(u.active ? `${u.name} deactivated. They can no longer log in.` : `${u.name} reactivated.`); }}>
                        {u.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No one matches that search.</p>}
      </Card>
      <p className="mt-3 text-xs text-slate-500">Attendance below 75% shows in amber.</p>
      <MemberProfile userId={profile} onClose={() => setProfile(null)} />
    </>
  );
}
