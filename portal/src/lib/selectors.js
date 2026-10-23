// Read-only helpers that work out derived numbers from the store state.
import { dayInRange, isPastDay, parseDay, ymd } from './dates';

export const byId = (list, id) => list.find((x) => x.id === id);
export const getUser = (st, id) => byId(st.users, id);

// Everyone except the admin (members and club leads).
export const people = (st) => st.users.filter((u) => u.role !== 'admin' && u.active);
export const leadsOf = (st) => st.users.filter((u) => u.role === 'lead' && u.active);
export const teamOf = (st, leadId) => st.users.filter((u) => u.leadId === leadId && u.active);
export const unassigned = (st) => st.users.filter((u) => u.role === 'member' && !u.leadId && u.active);

// Can this viewer manage this user? Admin: everyone. Lead: only their own team.
export function inScope(st, viewer, userId) {
  if (!viewer) return false;
  if (viewer.role === 'admin') return true;
  const u = getUser(st, userId);
  return viewer.role === 'lead' && !!u && u.leadId === viewer.id;
}

export function sessionState(s, now = Date.now()) {
  if (!s) return 'none';
  if (s.closedAt) return 'closed';
  return new Date(s.expiresAt).getTime() > now ? 'open' : 'closed';
}

export function currentSession(st) {
  return [...st.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] || null;
}

export function onApprovedLeave(st, userId, isoDate) {
  return st.leaves.some((l) => l.userId === userId && l.status === 'approved' && dayInRange(isoDate, l.from, l.to));
}

// Attendance % = verified sessions / sessions held since joining (leave days left out).
export function attendanceStats(st, userId, now = Date.now()) {
  const u = getUser(st, userId);
  if (!u) return { held: 0, verified: 0, pct: null, leave: 0 };
  const joined = parseDay(ymd(u.joinedAt));
  let held = 0;
  let verified = 0;
  let leave = 0;
  for (const s of st.sessions) {
    const started = new Date(s.startedAt);
    if (started < joined || started.getTime() > now) continue;
    const mark = st.attendance.find((a) => a.sessionId === s.id && a.userId === userId);
    const isVerified = mark && mark.status === 'verified';
    // A session still open only counts once this person is verified for it.
    if (sessionState(s, now) === 'open' && !isVerified) continue;
    if (onApprovedLeave(st, userId, s.startedAt)) { leave += 1; continue; }
    held += 1;
    if (isVerified) verified += 1;
  }
  return { held, verified, leave, pct: held ? Math.round((verified / held) * 100) : null };
}

export function latestSubmission(st, taskId, userId) {
  return st.submissions
    .filter((x) => x.taskId === taskId && x.userId === userId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] || null;
}

// not_submitted | missed | submitted | pass | fail
export function taskStatus(st, task, userId) {
  const sub = latestSubmission(st, task.id, userId);
  if (!sub) return isPastDay(task.deadline) ? 'missed' : 'not_submitted';
  if (sub.verdict === 'pending') return 'submitted';
  return sub.verdict;
}

export function isLate(sub, task) {
  return !!sub && !!task && ymd(sub.submittedAt) > task.deadline;
}

export function taskStats(st, userId) {
  const mine = st.tasks.filter((t) => t.assignees.includes(userId));
  const out = { assigned: mine.length, submitted: 0, pass: 0, fail: 0, todo: 0, missed: 0 };
  for (const t of mine) {
    const s = taskStatus(st, t, userId);
    if (s === 'submitted') out.submitted += 1;
    else if (s === 'pass') out.pass += 1;
    else if (s === 'fail') out.fail += 1;
    else if (s === 'missed') out.missed += 1;
    else out.todo += 1;
  }
  return out;
}

export const homePath = (role) => (role === 'admin' ? '/admin' : role === 'lead' ? '/lead' : '/member');
