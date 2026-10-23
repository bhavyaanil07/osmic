// The logged-in frame: sidebar, top bar with notifications, and animated page changes.
import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, CalendarCheck, CalendarOff, ClipboardList, LayoutDashboard, LogOut, Megaphone, Menu,
  Network, TrendingUp, UserPlus, Users, X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { currentSession, homePath, inScope, taskStatus, unassigned } from '../lib/selectors';
import { timeAgo } from '../lib/dates';
import { Avatar, cx, ease } from './ui';
import { Logo } from './Logo';

function useNav() {
  const { state, viewer } = useStore();
  if (!viewer) return [];
  const pendingSubs = state.submissions.filter((s) => s.verdict === 'pending' && s.userId !== viewer.id && inScope(state, viewer, s.userId)).length;
  const pendingLeaves = state.leaves.filter((l) => l.status === 'pending' && inScope(state, viewer, l.userId)).length;

  if (viewer.role === 'admin') {
    const cur = currentSession(state);
    const checkins = cur ? state.attendance.filter((a) => a.sessionId === cur.id && a.status === 'pending').length : 0;
    return [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/applications', label: 'Applications', icon: UserPlus, count: state.applications.filter((a) => a.status === 'pending').length },
      { to: '/admin/members', label: 'Members', icon: Users },
      { to: '/admin/teams', label: 'Teams', icon: Network, count: unassigned(state).length },
      { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, count: checkins },
      { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList, count: pendingSubs },
      { to: '/admin/leaves', label: 'Leave requests', icon: CalendarOff, count: pendingLeaves },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    ];
  }
  if (viewer.role === 'lead') {
    return [
      { to: '/lead', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/lead/team', label: 'My team', icon: Users },
      { to: '/lead/tasks', label: 'Tasks', icon: ClipboardList, count: pendingSubs },
      { to: '/lead/leaves', label: 'Leave requests', icon: CalendarOff, count: pendingLeaves },
      { to: '/lead/announcements', label: 'Announcements', icon: Megaphone },
    ];
  }
  const todo = state.tasks.filter((t) => t.assignees.includes(viewer.id) && taskStatus(state, t, viewer.id) === 'not_submitted').length;
  return [
    { to: '/member', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/member/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/member/tasks', label: 'My tasks', icon: ClipboardList, count: todo },
    { to: '/member/leave', label: 'Leave', icon: CalendarOff },
    { to: '/member/progress', label: 'My progress', icon: TrendingUp },
  ];
}

const ROLE_LABEL = { admin: 'ADMIN PORTAL', lead: 'CLUB LEAD', member: 'MEMBER' };
const ROLE_NAME = { admin: 'Admin', lead: 'Club lead', member: 'Member' };

function Sidebar({ onNavigate }) {
  const { viewer, actions } = useStore();
  const nav = useNav();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col gap-6 border-r border-brand-200/60 bg-ink-950/90 px-3 py-5 text-slate-700 backdrop-blur-xl">
      <div className="px-2"><Logo sub={ROLE_LABEL[viewer.role]} /></div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
            className={({ isActive }) => cx('relative flex min-h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors', isActive ? 'text-brand-700' : 'text-slate-500 hover:bg-white/5 hover:text-slate-900')}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-300 shadow-[0_0_18px_-4px_rgba(62,230,200,0.5)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                {isActive && <motion.span layoutId="nav-bar" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-signal shadow-glow-pink" />}
                <item.icon className="relative h-[18px] w-[18px]" aria-hidden="true" />
                <span className="relative flex-1">{item.label}</span>
                <AnimatePresence>
                  {item.count > 0 && (
                    <motion.span key={item.count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative rounded-full bg-brand-500 px-2 text-xs font-bold leading-5 text-ink-950 shadow-glow">
                      {item.count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-4">
        <Avatar name={viewer.name} photo={viewer.photo} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{viewer.name}</p>
          <p className="text-xs text-slate-400">{ROLE_NAME[viewer.role]}</p>
        </div>
        <button type="button" aria-label="Log out" title="Log out"
          onClick={() => { actions.logout(); navigate('/login'); }}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

function Notifications() {
  const { state, viewer, actions } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const mine = state.notifications.filter((n) => n.userId === viewer.id).slice(0, 12);
  const unread = mine.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <motion.button type="button" whileTap={{ scale: 0.94 }} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-panel text-slate-700 shadow-sm transition hover:border-slate-300">
        <motion.span animate={unread ? { rotate: [0, -14, 12, -8, 6, 0] } : {}} transition={{ duration: 0.8, repeat: unread ? Infinity : 0, repeatDelay: 4 }}>
          <Bell className="h-5 w-5" />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className="absolute right-0 top-14 z-40 w-[min(92vw,360px)] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-panel shadow-lift">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="font-display font-semibold">Notifications</p>
              {unread > 0 && (
                <button type="button" onClick={() => actions.markAllRead(viewer.id)} className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">Mark all read</button>
              )}
            </div>
            <ul className="scrollbar-thin max-h-[360px] overflow-y-auto">
              {mine.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You are all caught up.</li>}
              {mine.map((n, i) => (
                <motion.li key={n.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <button type="button" onClick={() => { setOpen(false); if (n.link) navigate(n.link); }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50">
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-200' : 'bg-brand-500')} aria-hidden="true" />
                    <span className="flex flex-col">
                      <span className={cx('text-sm', n.read ? 'text-slate-600' : 'font-medium text-slate-900')}>{n.text}</span>
                      <span className="text-xs text-slate-500">{timeAgo(n.at)}</span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppLayout({ role }) {
  const { viewer } = useStore();
  const location = useLocation();
  const outlet = useOutlet();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { setDrawer(false); }, [location.pathname]);

  if (!viewer) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (viewer.role !== role) return <Navigate to={homePath(viewer.role)} replace />;

  return (
    <div className="cyber-bg min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/50" onClick={() => setDrawer(false)} aria-hidden="true" />
            <motion.aside className="absolute inset-y-0 left-0 w-[272px] shadow-2xl"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
              <Sidebar onNavigate={() => setDrawer(false)} />
              <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="absolute right-3 top-5 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[256px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-ink-950/70 px-4 py-3 backdrop-blur-md sm:px-8">
          <button type="button" aria-label="Open menu" onClick={() => setDrawer(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-panel text-slate-700 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden font-mono text-xs font-medium tracking-wide text-slate-500 lg:block">
            <span className="text-signal">&gt;</span> osmic / <span className="text-brand-600">{location.pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'dashboard'}</span>
          </div>
          <Notifications />
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease }}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          className="font-display text-[26px] font-semibold leading-tight text-slate-900 sm:text-[30px]">
          {title}
        </motion.h1>
        {sub && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-1 text-[15px] text-slate-500">
            {sub}
          </motion.p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
