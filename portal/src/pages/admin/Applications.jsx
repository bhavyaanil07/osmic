import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Inbox, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getUser, leadsOf } from '../../lib/selectors';
import { timeAgo } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Badge, Button, EmptyState, ease } from '../../components/ui';
import { Tabs } from '../../components/bits';
import { useToast } from '../../components/Toasts';

export default function Applications() {
  const { state, actions } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const leads = leadsOf(state);
  const list = state.applications.filter((a) => a.status === tab);
  const count = (s) => state.applications.filter((a) => a.status === s).length;

  const [busy, setBusy] = useState(null);
  const approve = async (a) => {
    if (!a.leadId) return toast(`Choose a club lead for ${a.name} before approving.`, 'error');
    setBusy(a.id);
    const r = await actions.approveApplication(a.id);
    setBusy(null);
    if (r.error) return toast(r.error, 'error');
    if (r.emailed === false) return toast(`${r.name} approved, but the welcome email failed. Ask them to use "Forgot password?" to get a link.`, 'error');
    toast(`${r.name} approved and added to ${r.lead}'s team. Welcome email sent.`, 'email');
    return undefined;
  };
  const reject = async (a) => {
    setBusy(a.id);
    const r = await actions.rejectApplication(a.id);
    setBusy(null);
    if (r.error) return toast(r.error, 'error');
    toast(`${a.name}'s application was rejected. A polite email is on its way.`, 'email');
    return undefined;
  };
  const chooseLead = async (a, leadId) => {
    const r = await actions.setApplicationLead(a.id, leadId);
    if (r.error) toast(r.error, 'error');
  };

  return (
    <>
      <PageHeader title="Applications" sub="Only the admin decides who joins. Pick a club lead for each person, then approve." />
      <div className="mb-5">
        <Tabs id="apps" value={tab} onChange={setTab} tabs={[
          { value: 'pending', label: 'Pending', count: count('pending') },
          { value: 'approved', label: 'Approved', count: count('approved') },
          { value: 'rejected', label: 'Rejected', count: count('rejected') },
        ]} />
      </div>
      <motion.ul layout className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {list.map((a, i) => (
            <motion.li key={a.id} layout
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease } }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.3 } }}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-panel p-5 shadow-card">
              <Avatar name={a.name} photo={a.photo} size={56} />
              <div className="flex min-w-[220px] flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-semibold">{a.name}</span>
                  <Badge tone={a.status} />
                </div>
                <span className="font-mono text-[13px] text-slate-700">{a.roll}</span>
                <span className="text-[13px] text-slate-500">{a.email}</span>
                <span className="text-[13px] text-slate-500">Mobile {a.mobile} · WhatsApp {a.whatsapp} · applied {timeAgo(a.appliedAt)}</span>
                {a.status === 'approved' && <span className="text-[13px] font-semibold text-emerald-700">Club lead: {getUser(state, a.leadId)?.name}</span>}
              </div>
              {a.status === 'pending' && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="label text-xs">
                    Assign club lead
                    <select className="input min-h-[40px] py-2" value={a.leadId} onChange={(e) => chooseLead(a, e.target.value)}>
                      <option value="">Choose a lead</option>
                      {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </label>
                  <Button variant="success" icon={Check} onClick={() => approve(a)} disabled={busy === a.id}>{busy === a.id ? 'Working…' : 'Approve'}</Button>
                  <Button variant="danger" icon={X} onClick={() => reject(a)} disabled={busy === a.id}>Reject</Button>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {list.length === 0 && (
        <EmptyState icon={Inbox} title={tab === 'pending' ? 'No new applications' : `No ${tab} applications`} text="New applications from the Apply to join page appear here." />
      )}
    </>
  );
}
