import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ExternalLink, FileText, Inbox, Plus, Trash, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getUser, inScope, isLate, people, taskStatus, teamOf } from '../../lib/selectors';
import { DAY, fmtDate, relDay, timeAgo, ymd } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, ProgressBar, SectionTitle, Stagger, cx } from '../../components/ui';
import { useToast } from '../../components/Toasts';

function WorkLink({ sub }) {
  if (sub.link) {
    return (
      <a href={sub.link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 truncate font-mono text-[13px] text-brand-600 hover:text-brand-700">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{sub.link.replace(/^https?:\/\//, '')}</span>
      </a>
    );
  }
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate font-mono text-[13px] text-slate-700">
      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{sub.fileName}</span>
    </span>
  );
}

function CreateTask({ scope, isLead }) {
  const { actions } = useStore();
  const toast = useToast();
  const options = isLead ? ['My whole team', 'Selected members'] : ['All members', 'Club leads', 'Selected members'];
  const [f, setF] = useState({ title: '', description: '', deadline: ymd(new Date(Date.now() + 7 * DAY)), to: options[0] });
  const [pick, setPick] = useState([]);
  const [open, setOpen] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast('Give the task a title.', 'error');
    let assignees = scope.map((u) => u.id);
    if (f.to === 'Club leads') assignees = scope.filter((u) => u.role === 'lead').map((u) => u.id);
    if (f.to === 'Selected members') assignees = pick;
    if (!assignees.length) return toast(f.to === 'Selected members' ? 'Tick at least one member.' : 'There is no one to assign this to yet.', 'error');
    const r = actions.createTask({ title: f.title, description: f.description, deadline: f.deadline, assignees });
    if (r.error) return toast(r.error, 'error');
    toast(`Task created and emailed to ${r.count} ${r.count === 1 ? 'member' : 'members'}.`, 'email');
    setF({ ...f, title: '', description: '' });
    setPick([]);
    setOpen(false);
  };

  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-5 text-left">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-ink-950"><Plus className="h-5 w-5" aria-hidden="true" /></span>
          <span><span className="block font-display text-[17px] font-semibold">Assign a new task</span>
            <span className="block text-[13px] text-slate-500">{isLead ? 'To your whole team or selected team members' : 'To everyone, the club leads, or selected members'}</span></span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown className="h-5 w-5 text-slate-500" /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form onSubmit={submit} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-4 border-t border-slate-100 p-5">
              <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                <Field label="Task title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Build a portfolio page" /></Field>
                <Field label="Deadline"><input className="input" type="date" min={ymd()} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
                <Field label="Assign to">
                  <select className="input" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>{options.map((o) => <option key={o}>{o}</option>)}</select>
                </Field>
              </div>
              <Field label="What should they do?">
                <textarea className="input min-h-[84px] resize-y" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Explain the task and what to upload" />
              </Field>
              <AnimatePresence initial={false}>
                {f.to === 'Selected members' && (
                  <motion.fieldset initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <legend className="text-[13px] font-semibold text-slate-700">Choose members · {pick.length} selected</legend>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setPick(scope.map((u) => u.id))}>Select all</Button>
                          <Button size="sm" variant="ghost" onClick={() => setPick([])}>Clear</Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scope.map((u) => {
                          const on = pick.includes(u.id);
                          return (
                            <motion.label key={u.id} whileTap={{ scale: 0.96 }}
                              className={cx('inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[13px] font-medium transition-colors', on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 bg-panel text-slate-700 hover:border-slate-400')}>
                              <input type="checkbox" className="sr-only" checked={on} onChange={() => setPick((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))} />
                              <Avatar name={u.name} photo={u.photo} size={28} />
                              {u.name}
                              <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="h-3.5 w-3.5" /></motion.span>}</AnimatePresence>
                            </motion.label>
                          );
                        })}
                      </div>
                    </div>
                  </motion.fieldset>
                )}
              </AnimatePresence>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create task</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function TasksPage() {
  const { state, viewer, actions } = useStore();
  const toast = useToast();
  const isLead = viewer.role === 'lead';
  const scope = isLead ? teamOf(state, viewer.id) : people(state);
  const [review, setReview] = useState(null); // { sub, verdict }
  const [comment, setComment] = useState('');
  const [openTask, setOpenTask] = useState(null);

  const queue = state.submissions
    .filter((s) => s.verdict === 'pending' && s.userId !== viewer.id && inScope(state, viewer, s.userId))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const tasks = state.tasks
    .map((t) => ({ t, ppl: t.assignees.filter((id) => inScope(state, viewer, id) && id !== viewer.id) }))
    .filter(({ ppl }) => !isLead || ppl.length > 0);

  const confirm = () => {
    const r = actions.reviewSubmission(review.sub.id, review.verdict, comment);
    if (r.error) toast(r.error, 'error');
    else toast(`Marked ${review.verdict === 'pass' ? 'Pass' : 'Fail'}. ${r.name} was emailed the result.`, 'email');
    setReview(null);
    setComment('');
  };

  return (
    <>
      <PageHeader title="Tasks" sub={isLead ? 'Assign work to your team and check what they submit.' : 'Assign work and mark submissions Pass or Fail.'} />
      <Stagger className="flex flex-col gap-5">
        <CreateTask scope={scope} isLead={isLead} />

        <Card className="overflow-hidden">
          <div className="p-5 pb-3"><SectionTitle title={`To review · ${queue.length}`} sub={isLead ? 'Submissions from your team, oldest first' : 'All submissions waiting for a result, oldest first'} /></div>
          {queue.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing to review" text="New submissions show up here." />
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              <AnimatePresence initial={false}>
                {queue.map((s) => {
                  const u = getUser(state, s.userId);
                  const t = state.tasks.find((x) => x.id === s.taskId);
                  return (
                    <motion.li key={s.id} layout exit={{ opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.3 }}
                      className="flex flex-wrap items-center gap-3 overflow-hidden px-5 py-3.5">
                      <Avatar name={u.name} photo={u.photo} size={36} />
                      <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                        <span className="text-sm"><span className="font-semibold">{u.name}</span><span className="text-slate-500"> · {t?.title}</span></span>
                        <WorkLink sub={s} />
                      </div>
                      <span className="flex items-center gap-2 text-[13px] text-slate-500">{timeAgo(s.submittedAt)} {isLate(s, t) && <Badge tone="late" />}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" icon={Check} onClick={() => setReview({ sub: s, verdict: 'pass' })}>Pass</Button>
                        <Button size="sm" variant="danger" icon={X} onClick={() => setReview({ sub: s, verdict: 'fail' })}>Fail</Button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 pb-3"><SectionTitle title="All tasks" sub={isLead ? 'Tasks your team members have, with their status' : 'Every task, with who has submitted'} /></div>
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {tasks.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No tasks yet.</li>}
            {tasks.map(({ t, ppl }) => {
              const statuses = ppl.map((id) => ({ u: getUser(state, id), s: taskStatus(state, t, id) }));
              const done = statuses.filter((x) => ['submitted', 'pass', 'fail'].includes(x.s.toString())).length;
              const isOpen = openTask === t.id;
              const creator = getUser(state, t.createdBy);
              const canDelete = viewer.role === 'admin' || t.createdBy === viewer.id;
              return (
                <li key={t.id}>
                  <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="flex min-w-[220px] flex-[3] flex-col">
                      <span className="font-semibold">{t.title}</span>
                      <span className="text-[13px] text-slate-500">Due {fmtDate(t.deadline)} ({relDay(t.deadline)}) · by {creator?.id === viewer.id ? 'you' : creator?.name}</span>
                    </div>
                    <div className="flex min-w-[160px] flex-[2] items-center gap-3">
                      <ProgressBar value={ppl.length ? (done / ppl.length) * 100 : 0} className="flex-1" />
                      <span className="font-mono text-[13px] text-slate-600">{done}/{ppl.length}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setOpenTask(isOpen ? null : t.id)} aria-expanded={isOpen}>{isOpen ? 'Hide members' : 'View members'}</Button>
                      {canDelete && (
                        <Button size="sm" variant="ghost" aria-label={`Delete ${t.title}`} onClick={() => { actions.deleteTask(t.id); toast('Task deleted.'); }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mx-5 mb-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4">
                          {t.description && <p className="text-[13px] text-slate-600">{t.description}</p>}
                          <div className="flex flex-wrap gap-2">
                            {statuses.map(({ u, s }, i) => (
                              <motion.span key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-panel py-1 pl-1 pr-1.5 text-[13px]">
                                <Avatar name={u.name} photo={u.photo} size={22} /> {u.name} <Badge tone={s}>{s === 'submitted' ? 'To review' : undefined}</Badge>
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Card>
      </Stagger>

      <Modal open={!!review} onClose={() => setReview(null)} title={review?.verdict === 'pass' ? 'Mark as Pass' : 'Mark as Fail'}>
        {review && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              {getUser(state, review.sub.userId)?.name} · {state.tasks.find((t) => t.id === review.sub.taskId)?.title}
            </p>
            <Field label="Comment for the member (optional)">
              <textarea className="input min-h-[90px]" value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder={review.verdict === 'pass' ? 'Great work on…' : 'What should they fix?'} autoFocus />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReview(null)}>Cancel</Button>
              <Button variant={review.verdict === 'pass' ? 'success' : 'danger'} icon={review.verdict === 'pass' ? Check : X} onClick={confirm}>
                {review.verdict === 'pass' ? 'Mark Pass' : 'Mark Fail'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
