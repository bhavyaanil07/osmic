import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Megaphone, Send, Trash } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getUser } from '../../lib/selectors';
import { timeAgo } from '../../lib/dates';
import { PageHeader } from '../../components/AppLayout';
import { Avatar, Button, Card, EmptyState, Field, SectionTitle, Stagger } from '../../components/ui';
import { useToast } from '../../components/Toasts';

export default function AnnouncementsPage() {
  const { state, viewer, actions } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ title: '', message: '', sendEmail: true });

  const post = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast('Add a title.', 'error');
    const r = actions.postAnnouncement(f);
    if (r.error) return toast(r.error, 'error');
    toast(f.sendEmail ? 'Posted and emailed to all members.' : 'Posted on every member dashboard.', f.sendEmail ? 'email' : 'success');
    setF({ title: '', message: '', sendEmail: true });
  };

  return (
    <>
      <PageHeader title="Announcements" sub="Posts appear on every member dashboard." />
      <Stagger className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <Card className="h-fit p-6">
          <form onSubmit={post} className="flex flex-col gap-4">
            <SectionTitle title="New announcement" />
            <Field label="Title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Hackathon briefing on Friday" /></Field>
            <Field label="Message"><textarea className="input min-h-[120px] resize-y" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="What do members need to know?" /></Field>
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input type="checkbox" className="h-[18px] w-[18px] accent-brand-600" checked={f.sendEmail} onChange={(e) => setF({ ...f, sendEmail: e.target.checked })} />
              Also email all members
            </label>
            <Button type="submit" icon={Send}>Post announcement</Button>
          </form>
        </Card>
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {state.announcements.map((a) => {
              const by = getUser(state, a.by);
              return (
                <motion.article key={a.id} layout initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
                  className="rounded-2xl border border-slate-200 bg-panel p-5 shadow-card">
                  <div className="flex items-start gap-3">
                    <Avatar name={by?.name || 'OSMIC'} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-display font-semibold">{a.title}</h2>
                        <span className="text-xs text-slate-500">{timeAgo(a.postedAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.message}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">by {by?.name}{a.emailed && <span className="ml-2 inline-flex items-center gap-1 text-brand-600"><Mail className="h-3 w-3" aria-hidden="true" />emailed</span>}</span>
                        {(viewer.role === 'admin' || a.by === viewer.id) && (
                          <button type="button" aria-label="Delete announcement" onClick={() => { actions.deleteAnnouncement(a.id); toast('Announcement deleted.'); }}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash className="h-4 w-4" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
          {state.announcements.length === 0 && <EmptyState icon={Megaphone} title="No announcements yet" />}
        </div>
      </Stagger>
    </>
  );
}
