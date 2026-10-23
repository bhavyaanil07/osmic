// The demo "backend". All data lives in the browser (localStorage) for now.
// In stage 2 each action below becomes a Supabase call; the pages stay the same.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSeed, DEMO_PASSWORD } from './demoData';
import { getUser, inScope, sessionState, currentSession } from './selectors';
import { fmtDate } from './dates';

const STORAGE_KEY = 'osmic-demo-v1';
const StoreContext = createContext(null);

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch { /* storage blocked or corrupt: fall back to fresh demo data */ }
  return createSeed();
}

// --- small helpers used inside actions (they change the draft state) ---
function notify(st, userId, text, link) {
  st.notifications.unshift({ id: uid('m'), userId, text, link: link || '', at: new Date().toISOString(), read: false });
}
function email(st, to, subject) {
  st.outbox.unshift({ id: uid('e'), to, subject, at: new Date().toISOString() });
  st.outbox = st.outbox.slice(0, 40);
}
const nowIso = () => new Date().toISOString();

export function StoreProvider({ children }) {
  const [state, setState] = useState(load);
  const ref = useRef(state);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const actions = useMemo(() => {
    // Copy the state, let fn change the copy, save it, and return fn's result.
    const mutate = (fn) => {
      const next = structuredClone(ref.current);
      const result = fn(next);
      ref.current = next;
      setState(next);
      return result || {};
    };
    const viewerOf = (st) => (st.session ? getUser(st, st.session.userId) : null);

    return {
      // ---------- auth ----------
      login(emailAddr, password) {
        return mutate((st) => {
          const u = st.users.find((x) => x.email.toLowerCase() === emailAddr.trim().toLowerCase());
          if (!u || password !== DEMO_PASSWORD) return { error: 'Incorrect email or password.' };
          if (!u.active) return { error: 'Your account is inactive. Contact the admin.' };
          st.session = { userId: u.id };
          return { user: u };
        });
      },
      loginAs(userId) {
        return mutate((st) => {
          st.session = { userId };
          return { user: getUser(st, userId) };
        });
      },
      logout() {
        mutate((st) => { st.session = null; });
      },
      resetDemo() {
        const fresh = createSeed();
        ref.current = fresh;
        setState(fresh);
      },

      // ---------- applications (admin only decides) ----------
      submitApplication(data) {
        return mutate((st) => {
          const em = data.email.trim().toLowerCase();
          const roll = data.roll.trim().toUpperCase();
          const taken = st.users.some((u) => u.email.toLowerCase() === em || u.roll === roll)
            || st.applications.some((a) => a.status === 'pending' && (a.email.toLowerCase() === em || a.roll === roll));
          if (taken) return { error: 'An account or application with this email or roll number already exists.' };
          st.applications.unshift({ id: uid('p'), ...data, email: em, roll, status: 'pending', leadId: '', appliedAt: nowIso() });
          return { ok: true };
        });
      },
      setApplicationLead(appId, leadId) {
        mutate((st) => { const a = st.applications.find((x) => x.id === appId); if (a) a.leadId = leadId; });
      },
      approveApplication(appId) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          if (viewer?.role !== 'admin') return { error: 'Only the admin can approve applications.' };
          const a = st.applications.find((x) => x.id === appId);
          if (!a) return { error: 'Application not found.' };
          if (!a.leadId) return { error: `Choose a club lead for ${a.name} before approving.` };
          a.status = 'approved';
          const id = uid('u');
          st.users.push({ id, name: a.name, email: a.email, roll: a.roll, mobile: a.mobile, whatsapp: a.whatsapp, photo: a.photo, role: 'member', leadId: a.leadId, active: true, joinedAt: nowIso() });
          email(st, a.email, 'Welcome to OSMIC! Set your password');
          const lead = getUser(st, a.leadId);
          notify(st, a.leadId, `${a.name} joined your team`, '/lead/team');
          return { ok: true, name: a.name, lead: lead?.name };
        });
      },
      rejectApplication(appId) {
        return mutate((st) => {
          const a = st.applications.find((x) => x.id === appId);
          if (!a) return {};
          a.status = 'rejected';
          email(st, a.email, 'Your OSMIC application');
          return { ok: true, name: a.name };
        });
      },

      // ---------- members and teams ----------
      setLead(userId, leadId) {
        return mutate((st) => {
          const u = getUser(st, userId);
          if (!u) return {};
          u.leadId = leadId || null;
          if (leadId) notify(st, leadId, `${u.name} was added to your team`, '/lead/team');
          return { ok: true, name: u.name, lead: leadId ? getUser(st, leadId)?.name : null };
        });
      },
      toggleLeadRole(userId) {
        return mutate((st) => {
          const u = getUser(st, userId);
          if (!u) return {};
          if (u.role === 'lead') {
            u.role = 'member';
            let freed = 0;
            st.users.forEach((x) => { if (x.leadId === u.id) { x.leadId = null; freed += 1; } });
            return { ok: true, promoted: false, name: u.name, freed };
          }
          u.role = 'lead';
          u.leadId = null;
          notify(st, u.id, 'You are now a club lead', '/lead');
          email(st, u.email, 'You are now an OSMIC club lead');
          return { ok: true, promoted: true, name: u.name };
        });
      },
      setActive(userId, active) {
        return mutate((st) => {
          const u = getUser(st, userId);
          if (u) u.active = active;
          return { ok: true, name: u?.name };
        });
      },
      addToMyTeam(userId) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          const u = getUser(st, userId);
          if (!viewer || viewer.role !== 'lead' || !u) return { error: 'Not allowed.' };
          if (u.leadId) return { error: `${u.name} is already in a team.` };
          u.leadId = viewer.id;
          notify(st, u.id, `${viewer.name} is now your club lead`, '/member');
          return { ok: true, name: u.name };
        });
      },
      removeFromMyTeam(userId) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          const u = getUser(st, userId);
          if (!viewer || !u || u.leadId !== viewer.id) return { error: 'Not allowed.' };
          u.leadId = null;
          return { ok: true, name: u.name };
        });
      },

      // ---------- attendance (admin only) ----------
      startSession(title, minutes) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          if (viewer?.role !== 'admin') return { error: 'Only the admin runs attendance.' };
          const cur = currentSession(st);
          if (cur && !cur.closedAt) cur.closedAt = nowIso();
          const code = newCode();
          st.sessions.push({ id: uid('s'), title: title.trim() || `Session on ${fmtDate(nowIso())}`, startedAt: nowIso(), code, closedAt: null, expiresAt: new Date(Date.now() + minutes * 60000).toISOString() });
          return { ok: true, code };
        });
      },
      closeSession(sessionId) {
        mutate((st) => { const s = st.sessions.find((x) => x.id === sessionId); if (s) s.closedAt = nowIso(); });
      },
      extendSession(sessionId, minutes) {
        mutate((st) => {
          const s = st.sessions.find((x) => x.id === sessionId);
          if (!s) return;
          s.closedAt = null;
          const base = Math.max(Date.now(), new Date(s.expiresAt).getTime());
          s.expiresAt = new Date(base + minutes * 60000).toISOString();
        });
      },
      markAttendance(code) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          const s = currentSession(st);
          if (!viewer || !s || sessionState(s) !== 'open') return { error: 'No session is open right now.' };
          if (st.attendance.some((a) => a.sessionId === s.id && a.userId === viewer.id)) return { error: 'You have already checked in for this session.' };
          if (code.trim().toUpperCase() !== s.code) return { error: 'Wrong code. Check the screen and try again.' };
          st.attendance.push({ id: uid('a'), sessionId: s.id, userId: viewer.id, status: 'pending', markedAt: nowIso() });
          return { ok: true };
        });
      },
      setCheckin(attendanceId, status) {
        return mutate((st) => {
          const a = st.attendance.find((x) => x.id === attendanceId);
          if (!a) return {};
          a.status = status;
          const s = st.sessions.find((x) => x.id === a.sessionId);
          notify(st, a.userId, status === 'verified' ? `Attendance verified for ${s?.title}` : `Attendance rejected for ${s?.title}`, '/member/attendance');
          return { ok: true, name: getUser(st, a.userId)?.name };
        });
      },
      verifyAllPending(sessionId) {
        return mutate((st) => {
          let n = 0;
          const s = st.sessions.find((x) => x.id === sessionId);
          st.attendance.forEach((a) => {
            if (a.sessionId === sessionId && a.status === 'pending') {
              a.status = 'verified';
              n += 1;
              notify(st, a.userId, `Attendance verified for ${s?.title}`, '/member/attendance');
            }
          });
          return { ok: true, count: n };
        });
      },

      // ---------- tasks ----------
      createTask({ title, description, deadline, assignees }) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          if (!viewer || viewer.role === 'member') return { error: 'Not allowed.' };
          const allowed = assignees.filter((id) => inScope(st, viewer, id));
          if (!allowed.length) return { error: 'Choose at least one member.' };
          const task = { id: uid('t'), title: title.trim(), description: description.trim(), deadline, assignees: allowed, createdBy: viewer.id, createdAt: nowIso() };
          st.tasks.unshift(task);
          allowed.forEach((id) => {
            notify(st, id, `New task: ${task.title}`, '/member/tasks');
            const u = getUser(st, id);
            if (u) email(st, u.email, `New OSMIC task: ${task.title}`);
          });
          return { ok: true, count: allowed.length, id: task.id };
        });
      },
      deleteTask(taskId) {
        mutate((st) => {
          st.tasks = st.tasks.filter((t) => t.id !== taskId);
          st.submissions = st.submissions.filter((x) => x.taskId !== taskId);
        });
      },
      submitWork(taskId, { link, fileName, note }) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          const task = st.tasks.find((t) => t.id === taskId);
          if (!viewer || !task || !task.assignees.includes(viewer.id)) return { error: 'This task is not assigned to you.' };
          st.submissions.push({ id: uid('sub'), taskId, userId: viewer.id, link: link || '', fileName: fileName || '', note: note || '', submittedAt: nowIso(), verdict: 'pending', comment: '', reviewedBy: null });
          const reviewer = viewer.leadId || 'u0';
          notify(st, reviewer, `${viewer.name} submitted ${task.title}`, viewer.leadId ? '/lead/tasks' : '/admin/tasks');
          return { ok: true };
        });
      },
      reviewSubmission(subId, verdict, comment) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          const sub = st.submissions.find((x) => x.id === subId);
          if (!viewer || !sub || !inScope(st, viewer, sub.userId)) return { error: 'You can only review your own team.' };
          if (sub.userId === viewer.id) return { error: 'You cannot review your own work.' };
          sub.verdict = verdict;
          sub.comment = comment || '';
          sub.reviewedBy = viewer.id;
          const task = st.tasks.find((t) => t.id === sub.taskId);
          const u = getUser(st, sub.userId);
          notify(st, sub.userId, `Your ${task?.title} was marked ${verdict === 'pass' ? 'Pass' : 'Fail'}`, '/member/tasks');
          if (u) email(st, u.email, `Result for ${task?.title}: ${verdict === 'pass' ? 'Pass' : 'Fail'}`);
          return { ok: true, name: u?.name };
        });
      },

      // ---------- leave ----------
      applyLeave({ from, to, reason }) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          if (!viewer) return { error: 'Not logged in.' };
          if (to && to < from) return { error: 'The end date is before the start date.' };
          st.leaves.unshift({ id: uid('l'), userId: viewer.id, from, to: to || from, reason: reason.trim(), status: 'pending', note: '', appliedAt: nowIso() });
          if (viewer.leadId) notify(st, viewer.leadId, `${viewer.name} applied for leave`, '/lead/leaves');
          return { ok: true };
        });
      },
      decideLeave(leaveId, status, note) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          const l = st.leaves.find((x) => x.id === leaveId);
          if (!viewer || !l || !inScope(st, viewer, l.userId)) return { error: 'You can only decide for your own team.' };
          l.status = status;
          l.note = note || '';
          const u = getUser(st, l.userId);
          notify(st, l.userId, `Your leave for ${fmtDate(l.from)} was ${status}`, '/member/leave');
          if (u) email(st, u.email, `Leave ${status}`);
          return { ok: true, name: u?.name };
        });
      },

      // ---------- announcements ----------
      postAnnouncement({ title, message, sendEmail }) {
        return mutate((st) => {
          const viewer = viewerOf(st);
          if (!viewer || viewer.role === 'member') return { error: 'Not allowed.' };
          st.announcements.unshift({ id: uid('n'), title: title.trim(), message: message.trim(), postedAt: nowIso(), by: viewer.id, emailed: !!sendEmail });
          if (sendEmail) email(st, 'All members', `Announcement: ${title.trim()}`);
          return { ok: true };
        });
      },
      deleteAnnouncement(id) {
        mutate((st) => { st.announcements = st.announcements.filter((a) => a.id !== id); });
      },

      // ---------- notifications ----------
      markAllRead(userId) {
        mutate((st) => { st.notifications.forEach((n) => { if (n.userId === userId) n.read = true; }); });
      },
    };
  }, []);

  const viewer = state.session ? getUser(state, state.session.userId) : null;
  const value = useMemo(() => ({ state, viewer, actions }), [state, viewer, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
