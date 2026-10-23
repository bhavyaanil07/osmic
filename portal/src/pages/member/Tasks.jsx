import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleX, ClipboardList, ExternalLink, FileText, Link as LinkIcon, Paperclip, Upload } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getUser, isLate, latestSubmission, taskStatus } from '../../lib/selectors';
import { fmtDate, relDay, timeAgo } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Badge, Button, EmptyState, Field, cx, ease } from '../../components/ui';
import { Tabs } from '../../components/bits';
import { useToast } from '../../components/Toasts';

function SubmitBox({ task, onDone }) {
  const { actions } = useStore();
  const toast = useToast();
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast('Files must be 10 MB or smaller.', 'error');
    setFile(f);
  };
  const submit = () => {
    if (mode === 'file' && !file) return toast('Choose a file first.', 'error');
    if (mode === 'link' && !/^https?:\/\/\S+\.\S+/.test(link.trim())) return toast('Paste a full link starting with https://', 'error');
    const r = actions.submitWork(task.id, mode === 'file' ? { fileName: file.name, note } : { link: link.trim(), note });
    if (r.error) return toast(r.error, 'error');
    toast('Submitted. Your club lead will review it.');
    onDone?.();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="inline-flex self-start rounded-lg bg-panel p-1 ring-1 ring-slate-200">
        {[['file', 'Upload file', Upload], ['link', 'Paste link', LinkIcon]].map(([v, label, Icon]) => (
          <button key={v} type="button" onClick={() => setMode(v)} aria-pressed={mode === v}
            className={cx('relative inline-flex min-h-[34px] items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold', mode === v ? 'text-ink-950' : 'text-slate-600')}>
            {mode === v && <motion.span layoutId={`mode-${task.id}`} className="absolute inset-0 rounded-md bg-brand-600" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
            <Icon className="relative h-3.5 w-3.5" aria-hidden="true" /><span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {mode === 'file' ? (
          <motion.button key="file" type="button" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            onClick={() => ref.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={cx('flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors', drag ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-panel hover:border-brand-400')}>
            {file ? (
              <span className="inline-flex items-center gap-2 font-mono text-sm text-slate-800"><Paperclip className="h-4 w-4" aria-hidden="true" />{file.name}</span>
            ) : (
              <>
                <Upload className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <span className="text-sm font-medium text-slate-700">Drop a file here or click to choose</span>
                <span className="text-xs text-slate-500">PDF, ZIP, image or doc · up to 10 MB</span>
              </>
            )}
            <input ref={ref} type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </motion.button>
        ) : (
          <motion.div key="link" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <Field label="Link to your work"><input className="input font-mono text-[13px]" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://github.com/you/project" /></Field>
          </motion.div>
        )}
      </AnimatePresence>
      <Field label="Note for the reviewer (optional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything they should know" /></Field>
      <Button className="self-start" icon={Upload} onClick={submit}>Submit work</Button>
    </div>
  );
}

function TaskCard({ task, index }) {
  const { state, viewer } = useStore();
  const status = taskStatus(state, task, viewer.id);
  const sub = latestSubmission(state, task.id, viewer.id);
  const [resubmit, setResubmit] = useState(false);
  const due = relDay(task.deadline);
  const urgent = status === 'not_submitted' && ['today', 'tomorrow'].includes(due);
  const by = getUser(state, task.createdBy);
  const showForm = resubmit;

  return (
    <motion.li layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.4, ease } }} exit={{ opacity: 0, scale: 0.97 }}
      className={cx('flex flex-col gap-4 rounded-2xl border bg-panel p-5 shadow-card', urgent ? 'border-amber-300' : 'border-slate-200')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{task.title}</h2>
          <p className={cx('text-[13px]', urgent ? 'font-semibold text-amber-700' : 'text-slate-500')}>Due {fmtDate(task.deadline)} ({due}) · from {by?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {sub && isLate(sub, task) && <Badge tone="late" />}
          <Badge tone={status}>{status === 'submitted' ? 'Waiting for review' : undefined}</Badge>
        </div>
      </div>
      {task.description && <p className="text-sm text-slate-600">{task.description}</p>}

      {sub && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            {sub.link ? (
              <a href={sub.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 truncate font-mono text-[13px] text-brand-600"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />{sub.link.replace(/^https?:\/\//, '')}</a>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-slate-700"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{sub.fileName}</span>
            )}
            <span className="text-xs text-slate-500">submitted {timeAgo(sub.submittedAt)}</span>
          </div>
          {sub.verdict !== 'pending' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={cx('flex items-start gap-2.5 rounded-lg p-3 text-sm', sub.verdict === 'pass' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900')}>
              <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}>
                {sub.verdict === 'pass' ? <CircleCheck className="h-5 w-5 text-emerald-600" /> : <CircleX className="h-5 w-5 text-red-600" />}
              </motion.span>
              <span><span className="font-semibold">{sub.verdict === 'pass' ? 'Passed' : 'Not passed'}</span> · reviewed by {getUser(state, sub.reviewedBy)?.name}
                {sub.comment && <span className="block text-[13px] opacity-80">“{sub.comment}”</span>}</span>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <SubmitBox task={task} onDone={() => setResubmit(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {!showForm && (status === 'not_submitted' || status === 'missed') && (
        <Button icon={Upload} className="self-start" onClick={() => setResubmit(true)}>Submit work</Button>
      )}
      {!showForm && (status === 'submitted' || status === 'fail') && (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setResubmit(true)}>{status === 'fail' ? 'Submit again' : 'Replace submission'}</Button>
      )}
      {showForm && <button type="button" onClick={() => setResubmit(false)} className="-mt-2 self-start text-[13px] font-semibold text-slate-500 hover:text-slate-800">Cancel</button>}
    </motion.li>
  );
}

export default function MemberTasks() {
  const { state, viewer } = useStore();
  const [tab, setTab] = useState('todo');
  const mine = state.tasks.filter((t) => t.assignees.includes(viewer.id)).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const group = (t) => {
    const s = taskStatus(state, t, viewer.id);
    if (s === 'not_submitted' || s === 'missed') return 'todo';
    if (s === 'submitted') return 'submitted';
    return 'reviewed';
  };
  const list = mine.filter((t) => group(t) === tab);
  const count = (g) => mine.filter((t) => group(t) === g).length;

  return (
    <>
      <PageHeader title="My tasks" sub="Upload your work before the deadline. Your club lead reviews it." />
      <div className="mb-5">
        <Tabs id="mytasks" value={tab} onChange={setTab} tabs={[
          { value: 'todo', label: 'To do', count: count('todo') },
          { value: 'submitted', label: 'Waiting for review', count: count('submitted') },
          { value: 'reviewed', label: 'Reviewed', count: count('reviewed') },
        ]} />
      </div>
      <ul className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {list.map((t, i) => <TaskCard key={t.id} task={t} index={i} />)}
        </AnimatePresence>
      </ul>
      {list.length === 0 && <EmptyState icon={ClipboardList} title={tab === 'todo' ? 'Nothing to do right now' : tab === 'submitted' ? 'Nothing waiting for review' : 'No reviewed tasks yet'} />}
    </>
  );
}
