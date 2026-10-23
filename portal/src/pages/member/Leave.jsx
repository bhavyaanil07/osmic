import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarOff, Send } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getUser } from '../../lib/selectors';
import { fmtRange, relDay, ymd } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Badge, Button, Card, EmptyState, Field, SectionTitle, Stagger } from '../../components/ui';
import { useToast } from '../../components/Toasts';

export default function MemberLeave() {
  const { state, viewer, actions } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ from: '', to: '', reason: '' });
  const lead = viewer.leadId ? getUser(state, viewer.leadId) : null;
  const mine = state.leaves.filter((l) => l.userId === viewer.id);

  const submit = (e) => {
    e.preventDefault();
    if (!f.from || !f.reason.trim()) return toast('Pick a start date and write a reason.', 'error');
    const r = actions.applyLeave(f);
    if (r.error) return toast(r.error, 'error');
    toast('Leave request sent. You will get an email when it is decided.');
    setF({ from: '', to: '', reason: '' });
  };

  return (
    <>
      <PageHeader title="Leave" sub={`Requests go to ${lead ? lead.name : 'the admin'}${lead ? ' and the admin' : ''}. Approved leave is not counted as absent.`} />
      <Stagger className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="h-fit p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <SectionTitle title="Apply for leave" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="From"><input className="input" type="date" min={ymd()} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
              <Field label="To" hint="Leave empty for one day"><input className="input" type="date" min={f.from || ymd()} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
            </div>
            <Field label="Reason"><textarea className="input min-h-[96px] resize-y" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Why do you need leave?" /></Field>
            <Button type="submit" icon={Send}>Send request</Button>
          </form>
        </Card>
        <Card className="p-6">
          <SectionTitle title="My requests" />
          {mine.length === 0 ? <EmptyState icon={CalendarOff} title="No leave requests yet" /> : (
            <ul className="mt-3 flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {mine.map((l) => (
                  <motion.li key={l.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
                    <div className="min-w-0">
                      <p className="font-semibold">{fmtRange(l.from, l.to)} <span className="text-sm font-normal text-slate-500">· {relDay(l.from)}</span></p>
                      <p className="text-sm text-slate-600">{l.reason}</p>
                      {l.note && <p className="mt-1 text-[13px] text-slate-500">Note: {l.note}</p>}
                    </div>
                    <Badge tone={l.status} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </Stagger>
    </>
  );
}
