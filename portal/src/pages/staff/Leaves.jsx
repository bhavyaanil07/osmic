import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarOff, Check, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getUser, inScope } from '../../lib/selectors';
import { fmtRange, relDay, timeAgo } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Badge, Button, EmptyState, ease } from '../../components/ui';
import { Tabs } from '../../components/bits';
import { useToast } from '../../components/Toasts';

export default function LeavesPage() {
  const { state, viewer, actions } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [notes, setNotes] = useState({});
  const mine = state.leaves.filter((l) => inScope(state, viewer, l.userId));
  const list = mine.filter((l) => (tab === 'pending' ? l.status === 'pending' : l.status !== 'pending'));

  const decide = (l, status) => {
    const r = actions.decideLeave(l.id, status, notes[l.id] || '');
    if (r.error) return toast(r.error, 'error');
    toast(`Leave ${status}. ${r.name} was notified by email.`, 'email');
  };

  return (
    <>
      <PageHeader title="Leave requests" sub={viewer.role === 'lead' ? 'Requests from your team. Approved leave is not counted as absent.' : 'Approved leave is not counted as absent.'} />
      <div className="mb-5">
        <Tabs id="leaves" value={tab} onChange={setTab} tabs={[
          { value: 'pending', label: 'Waiting', count: mine.filter((l) => l.status === 'pending').length },
          { value: 'done', label: 'Decided', count: mine.filter((l) => l.status !== 'pending').length },
        ]} />
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((l, i) => {
            const u = getUser(state, l.userId);
            return (
              <motion.li key={l.id} layout
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease } }} exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-panel p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} photo={u.photo} size={40} />
                  <div className="flex-1">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-slate-500">applied {timeAgo(l.appliedAt)}</p>
                  </div>
                  <Badge tone={l.status} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-display font-semibold">{fmtRange(l.from, l.to)} <span className="text-sm font-normal text-slate-500">· {relDay(l.from)}</span></p>
                  <p className="text-sm text-slate-600">{l.reason}</p>
                  {l.note && <p className="mt-1 text-[13px] text-slate-500">Note: {l.note}</p>}
                </div>
                {l.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <input className="input min-h-[40px] flex-1 py-2" aria-label="Note for the member" placeholder="Note (optional)" value={notes[l.id] || ''} onChange={(e) => setNotes({ ...notes, [l.id]: e.target.value })} />
                    <Button size="sm" variant="success" icon={Check} onClick={() => decide(l, 'approved')}>Approve</Button>
                    <Button size="sm" variant="danger" icon={X} onClick={() => decide(l, 'rejected')}>Reject</Button>
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {list.length === 0 && <EmptyState icon={CalendarOff} title={tab === 'pending' ? 'No requests waiting' : 'Nothing decided yet'} />}
    </>
  );
}
