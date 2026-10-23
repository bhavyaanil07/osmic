import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { attendanceStats, leadsOf, teamOf, unassigned } from '../../lib/selectors';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Card, ProgressBar, SectionTitle, Stagger } from '../../components/ui';
import { MemberProfile } from '../../components/bits';
import { useToast } from '../../components/Toasts';

export default function Teams() {
  const { state, actions } = useStore();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const leads = leadsOf(state);
  const free = unassigned(state);

  const assign = (u, leadId) => {
    if (!leadId) return;
    const r = actions.setLead(u.id, leadId);
    toast(`${r.name} joined ${r.lead}'s team.`);
  };

  return (
    <>
      <PageHeader title="Teams" sub="Which members each club lead looks after. Leads check their own team's tasks and leave." />
      <Stagger className="flex flex-col gap-5">
        <AnimatePresence>
          {free.length > 0 && (
            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: -20 }}
              className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <SectionTitle title={`Members without a club lead · ${free.length}`} sub="Give each one a lead so someone checks their work." />
              <ul className="mt-3 flex flex-col gap-2">
                <AnimatePresence>
                  {free.map((u) => (
                    <motion.li key={u.id} layout exit={{ opacity: 0, x: 40 }} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-panel px-4 py-3">
                      <Avatar name={u.name} photo={u.photo} size={36} />
                      <span className="flex min-w-[160px] flex-1 flex-col"><span className="font-semibold">{u.name}</span><span className="font-mono text-xs text-slate-500">{u.roll}</span></span>
                      <select aria-label={`Club lead for ${u.name}`} className="input min-h-[40px] w-48 py-2" value="" onChange={(e) => assign(u, e.target.value)}>
                        <option value="">Choose a lead</option>
                        {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-5 md:grid-cols-2">
          {leads.map((l) => {
            const team = teamOf(state, l.id);
            const stats = team.map((u) => attendanceStats(state, u.id).pct).filter((p) => p != null);
            const avg = stats.length ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : null;
            return (
              <Card key={l.id} hover className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <Avatar name={l.name} photo={l.photo} size={48} />
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold">{l.name}</p>
                    <p className="text-[13px] text-slate-500">Club lead · {team.length} {team.length === 1 ? 'member' : 'members'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold">{avg == null ? '–' : `${avg}%`}</p>
                    <p className="text-[11px] text-slate-500">team attendance</p>
                  </div>
                </div>
                <ProgressBar value={avg ?? 0} tone={avg == null || avg >= 75 ? 'brand' : 'amber'} />
                <motion.ul layout className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {team.map((u) => (
                      <motion.li key={u.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <button type="button" onClick={() => setProfile(u.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-[13px] font-medium transition hover:border-brand-300 hover:bg-brand-50">
                          <Avatar name={u.name} photo={u.photo} size={24} /> {u.name}
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
                {team.length === 0 && <p className="text-sm text-slate-500">No members yet.</p>}
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">To move a member to another lead, change their club lead on the Members page. To make someone a lead, use Make lead there.</p>
      </Stagger>
      <MemberProfile userId={profile} onClose={() => setProfile(null)} />
    </>
  );
}
