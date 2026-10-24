// The portal's data, loaded from Supabase.
// Each person only receives what the database rules allow them to see. The data is reloaded
// automatically when something changes (live updates), so every screen stays current.
// Pages use `state` (same shape as before) and `actions` (each returns { error } or a result).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { callFunction, friendly, supabase } from './supabase';
import { getUser } from './selectors';

const StoreContext = createContext(null);

const EMPTY = {
  users: [], applications: [], sessions: [], attendance: [], tasks: [], submissions: [],
  leaves: [], announcements: [], notifications: [], outbox: [], passkeys: [],
};

// ---------- database rows -> the shapes the pages use ----------
const mapUser = (r, photos) => ({
  id: r.id, name: r.name, email: r.email, roll: r.roll, mobile: r.mobile, whatsapp: r.whatsapp,
  photo: r.photo_path ? photos[r.photo_path] || null : null, photoPath: r.photo_path,
  role: r.role, leadId: r.lead_id, active: r.active, joinedAt: r.joined_at,
});
const mapApp = (r, photos) => ({
  id: r.id, name: r.name, roll: r.roll, email: r.email, mobile: r.mobile, whatsapp: r.whatsapp,
  photo: r.photo_path ? photos[r.photo_path] || null : null, status: r.status, leadId: r.lead_id || '', appliedAt: r.applied_at,
});
const mapSession = (r) => ({ id: r.id, title: r.title, startedAt: r.started_at, expiresAt: r.expires_at, closedAt: r.closed_at, code: '' });
const mapAttendance = (r) => ({ id: r.id, sessionId: r.session_id, userId: r.user_id, status: r.status, markedAt: r.marked_at });
const mapTask = (r, assignees) => ({
  id: r.id, title: r.title, description: r.description, deadline: r.deadline, createdBy: r.created_by, createdAt: r.created_at,
  assignees: assignees.filter((a) => a.task_id === r.id).map((a) => a.user_id),
});
const mapSubmission = (r) => ({
  id: r.id, taskId: r.task_id, userId: r.user_id, link: r.link, fileName: r.file_name, filePath: r.file_path, note: r.note,
  submittedAt: r.submitted_at, verdict: r.verdict, comment: r.comment, reviewedBy: r.reviewed_by,
});
const mapLeave = (r) => ({ id: r.id, userId: r.user_id, from: r.from_date, to: r.to_date, reason: r.reason, status: r.status, note: r.note, appliedAt: r.applied_at });
const mapAnnouncement = (r) => ({ id: r.id, title: r.title, message: r.message, postedAt: r.posted_at, by: r.posted_by, emailed: r.emailed });
const mapNotification = (r) => ({ id: r.id, userId: r.user_id, text: r.text, link: r.link, at: r.created_at, read: r.read });
const mapOutbox = (r) => ({ id: r.id, to: r.to_emails.length > 1 ? `${r.to_emails.length} people` : r.to_emails[0], subject: r.subject, at: r.sent_at || r.created_at, sent: !!r.sent_at, failed: !r.sent_at && r.attempts >= 5 });
const mapPasskey = (r) => ({ id: r.id, device: r.device || 'This device', createdAt: r.created_at, lastUsedAt: r.last_used_at });

const rows = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export function StoreProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [loadedFor, setLoadedFor] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [hasAdmin, setHasAdmin] = useState(null);
  const loadingRef = useRef(null);

  // ---------- who is signed in ----------
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: s }) => {
      if (!alive) return;
      setUserId(s.session?.user?.id ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    // Only trust a real answer: if the server can't be reached, don't show first-time setup.
    supabase.rpc('has_admin').then(({ data: h, error }) => { if (alive && !error && typeof h === 'boolean') setHasAdmin(h); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // ---------- load everything this person may see ----------
  const load = useCallback(async () => {
    if (!userId) return;
    const run = (async () => {
      try {
        const [profiles, applications, sessions, attendance, tasks, assignees, submissions, leaves, announcements, notifications, outbox, passkeys] = await Promise.all([
          rows(supabase.from('profiles').select('*').order('name')),
          rows(supabase.from('applications').select('*').order('applied_at', { ascending: false })),
          rows(supabase.from('sessions').select('*').order('started_at')),
          rows(supabase.from('attendance').select('*')),
          rows(supabase.from('tasks').select('*').order('created_at', { ascending: false })),
          rows(supabase.from('task_assignees').select('*')),
          rows(supabase.from('submissions').select('*').order('submitted_at')),
          rows(supabase.from('leaves').select('*').order('applied_at', { ascending: false })),
          rows(supabase.from('announcements').select('*').order('posted_at', { ascending: false }).limit(50)),
          rows(supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)),
          rows(supabase.from('outbox').select('id, to_emails, subject, created_at, sent_at, attempts').order('created_at', { ascending: false }).limit(20)),
          rows(supabase.from('passkeys').select('id, device, created_at, last_used_at').order('created_at')),
        ]);
        // Photos are private: get short-lived links for the ones this person can see.
        const paths = [...new Set([...profiles, ...applications].map((r) => r.photo_path).filter(Boolean))];
        const photos = {};
        if (paths.length) {
          const { data: signed } = await supabase.storage.from('photos').createSignedUrls(paths, 3600);
          (signed || []).forEach((s) => { if (s.signedUrl) photos[s.path] = s.signedUrl; });
        }
        const next = {
          users: profiles.map((r) => mapUser(r, photos)),
          applications: applications.map((r) => mapApp(r, photos)),
          sessions: sessions.map(mapSession),
          attendance: attendance.map(mapAttendance),
          tasks: tasks.map((r) => mapTask(r, assignees)),
          submissions: submissions.map(mapSubmission),
          leaves: leaves.map(mapLeave),
          announcements: announcements.map(mapAnnouncement),
          notifications: notifications.map(mapNotification),
          outbox: outbox.map(mapOutbox),
          passkeys: passkeys.map(mapPasskey),
        };
        // The admin also gets the code of the latest session.
        const me = profiles.find((p) => p.id === userId);
        const latest = next.sessions[next.sessions.length - 1];
        if (me?.role === 'admin' && latest) {
          const { data: code } = await supabase.rpc('session_code', { p_session: latest.id });
          latest.code = code || '';
        }
        setData(next);
        setLoadedFor(userId);
        setLoadError('');
      } catch (err) {
        setLoadError(await friendly(err));
        setLoadedFor(userId);
      }
    })();
    loadingRef.current = run;
    return run;
  }, [userId]);

  useEffect(() => {
    if (!userId) { setData(EMPTY); setLoadedFor(null); return undefined; }
    load();
    // Live updates: reload shortly after anything changes in the database.
    let timer = null;
    const reload = () => { clearTimeout(timer); timer = setTimeout(load, 350); };
    const channel = supabase.channel(`osmic-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, reload)
      .subscribe();
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => { clearTimeout(timer); supabase.removeChannel(channel); window.removeEventListener('focus', onFocus); };
  }, [userId, load]);

  const state = useMemo(() => ({ ...data, session: userId ? { userId } : null }), [data, userId]);
  const viewer = userId ? getUser(state, userId) || null : null;

  // A deactivated (or removed) account is signed out.
  useEffect(() => {
    if (userId && loadedFor === userId && !loadError && (!viewer || !viewer.active)) {
      supabase.auth.signOut();
    }
  }, [userId, loadedFor, loadError, viewer]);

  // ---------- actions ----------
  const actions = useMemo(() => {
    // Send any queued emails now instead of waiting for the 5-minute job.
    const flushMail = () => { supabase.functions.invoke('mailer', { body: {} }).catch(() => {}); };
    // Run a change, reload the data, and return { error } or the result.
    const run = async (fn, { mail = false } = {}) => {
      try {
        const result = await fn();
        await load();
        if (mail) flushMail();
        return result || { ok: true };
      } catch (err) {
        return { error: await friendly(err) };
      }
    };
    const check = ({ error }) => { if (error) throw error; };
    const nameOf = (id) => getUser(data, id)?.name || 'This member';

    return {
      // ----- account -----
      async login(email, password) {
        const { data: res, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return { error: await friendly(error) };
        const { data: p } = await supabase.from('profiles').select('id, role, active').eq('id', res.user.id).maybeSingle();
        if (!p || !p.active) {
          await supabase.auth.signOut();
          return { error: 'Your account is inactive. Contact the admin.' };
        }
        return { user: p };
      },
      async logout() {
        await supabase.auth.signOut();
      },
      async requestPasswordReset(email) {
        try { await callFunction('reset-password', { email }); return { ok: true }; } catch (err) { return { error: err.message }; }
      },
      async bootstrapAdmin(email, name) {
        try { await callFunction('bootstrap-admin', { email, name }); return { ok: true }; } catch (err) { return { error: err.message }; }
      },
      // Opened from the email link: turn the one-time token into a signed-in session.
      async useEmailLink(tokenHash, type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        return error ? { error: /expired|invalid/i.test(error.message) ? 'This link has expired or was already used. Use "Forgot password?" to get a new one.' : await friendly(error) } : { ok: true };
      },
      async setPassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { error: await friendly(error) };
        await load();
        return { ok: true };
      },
      async signInWithTokenHash(tokenHash) {
        let { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
        if (error) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' }));
        return error ? { error: await friendly(error) } : { ok: true };
      },

      // ----- applications -----
      async submitApplication(f) {
        try {
          let photoPath = null;
          if (f.photo) {
            const blob = await (await fetch(f.photo)).blob();
            photoPath = `applications/${crypto.randomUUID()}.jpg`;
            const { error: upErr } = await supabase.storage.from('photos').upload(photoPath, blob, { contentType: 'image/jpeg' });
            if (upErr) throw upErr;
          }
          const { error } = await supabase.rpc('submit_application', {
            p_name: f.name, p_roll: f.roll, p_email: f.email, p_mobile: f.mobile, p_whatsapp: f.whatsapp, p_photo_path: photoPath,
          });
          if (error) throw error;
          return { ok: true };
        } catch (err) {
          return { error: await friendly(err) };
        }
      },
      setApplicationLead: (appId, leadId) => run(async () => check(await supabase.from('applications').update({ lead_id: leadId || null }).eq('id', appId))),
      approveApplication: (appId) => run(async () => callFunction('approve-application', { applicationId: appId })),
      rejectApplication: (appId) => run(async () => {
        check(await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId));
        return { name: data.applications.find((a) => a.id === appId)?.name };
      }, { mail: true }),

      // ----- members and teams -----
      setLead: (id, leadId) => run(async () => {
        check(await supabase.from('profiles').update({ lead_id: leadId || null }).eq('id', id));
        return { name: nameOf(id), lead: leadId ? nameOf(leadId) : null };
      }),
      toggleLeadRole: (id) => run(async () => {
        const u = getUser(data, id);
        const promoted = u.role !== 'lead';
        const freed = promoted ? 0 : data.users.filter((x) => x.leadId === id).length;
        check(await supabase.from('profiles').update(promoted ? { role: 'lead', lead_id: null } : { role: 'member' }).eq('id', id));
        return { promoted, name: u.name, freed };
      }, { mail: true }),
      setActive: (id, active) => run(async () => { check(await supabase.from('profiles').update({ active }).eq('id', id)); return { name: nameOf(id) }; }),
      addToMyTeam: (id) => run(async () => { check(await supabase.rpc('add_to_my_team', { p_user: id })); return { name: nameOf(id) }; }),
      removeFromMyTeam: (id) => run(async () => { check(await supabase.rpc('remove_from_my_team', { p_user: id })); return { name: nameOf(id) }; }),

      // ----- attendance (admin) -----
      startSession: (title, minutes) => run(async () => {
        const { data: s, error } = await supabase.rpc('start_session', { p_title: title, p_minutes: minutes });
        if (error) throw error;
        return { code: s.code };
      }),
      closeSession: (id) => run(async () => check(await supabase.from('sessions').update({ closed_at: new Date().toISOString() }).eq('id', id))),
      extendSession: (id, minutes) => run(async () => {
        const s = data.sessions.find((x) => x.id === id);
        const base = Math.max(Date.now(), new Date(s?.expiresAt || Date.now()).getTime());
        check(await supabase.from('sessions').update({ closed_at: null, expires_at: new Date(base + minutes * 60000).toISOString() }).eq('id', id));
      }),
      markAttendance: (code) => run(async () => check(await supabase.rpc('mark_attendance', { p_code: code }))),
      setCheckin: (id, status) => run(async () => {
        check(await supabase.from('attendance').update({ status }).eq('id', id));
        return { name: nameOf(data.attendance.find((a) => a.id === id)?.userId) };
      }),
      verifyAllPending: (sessionId) => run(async () => {
        const { data: n, error } = await supabase.rpc('verify_all_pending', { p_session: sessionId });
        if (error) throw error;
        return { count: n };
      }),

      // ----- tasks -----
      createTask: ({ title, description, deadline, assignees }) => run(async () => {
        const { data: t, error } = await supabase.rpc('create_task', { p_title: title, p_description: description, p_deadline: deadline, p_assignees: assignees });
        if (error) throw error;
        return { count: t.count, id: t.id };
      }, { mail: true }),
      deleteTask: (id) => run(async () => check(await supabase.from('tasks').delete().eq('id', id))),
      submitWork: (taskId, { link, file, note }) => run(async () => {
        let filePath = null;
        if (file) {
          const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
          filePath = `${userId}/${taskId}/${Date.now()}-${safe}`;
          const { error: upErr } = await supabase.storage.from('submissions').upload(filePath, file, { contentType: file.type || 'application/octet-stream' });
          if (upErr) throw upErr;
        }
        check(await supabase.from('submissions').insert({ task_id: taskId, user_id: userId, link: link || '', file_path: filePath, file_name: file ? file.name : '', note: note || '' }));
      }),
      reviewSubmission: (id, verdict, comment) => run(async () => {
        check(await supabase.from('submissions').update({ verdict, comment: comment || '' }).eq('id', id));
        return { name: nameOf(data.submissions.find((s) => s.id === id)?.userId) };
      }, { mail: true }),
      async openFile(sub) {
        const { data: s, error } = await supabase.storage.from('submissions').createSignedUrl(sub.filePath, 300);
        if (error) return { error: await friendly(error) };
        window.open(s.signedUrl, '_blank', 'noopener');
        return { ok: true };
      },

      // ----- leave -----
      applyLeave: ({ from, to, reason }) => run(async () => {
        if (to && to < from) throw new Error('The end date is before the start date.');
        check(await supabase.from('leaves').insert({ user_id: userId, from_date: from, to_date: to || from, reason: reason.trim() }));
      }),
      decideLeave: (id, status, note) => run(async () => {
        check(await supabase.from('leaves').update({ status, note: note || '' }).eq('id', id));
        return { name: nameOf(data.leaves.find((l) => l.id === id)?.userId) };
      }, { mail: true }),

      // ----- announcements and notifications -----
      postAnnouncement: ({ title, message, sendEmail }) => run(async () => {
        check(await supabase.from('announcements').insert({ title: title.trim(), message: message.trim(), emailed: !!sendEmail, posted_by: userId }));
      }, { mail: true }),
      deleteAnnouncement: (id) => run(async () => check(await supabase.from('announcements').delete().eq('id', id))),
      markAllRead: () => run(async () => check(await supabase.rpc('mark_notifications_read'))),

      // ----- Face ID / fingerprint devices -----
      removePasskey: (id) => run(async () => check(await supabase.from('passkeys').delete().eq('id', id))),
      reload: load,
    };
  }, [data, load, userId]);

  const loading = !authReady || (userId && loadedFor !== userId);
  const value = useMemo(() => ({ state, viewer, actions, loading, loadError, hasAdmin, setHasAdmin }), [state, viewer, actions, loading, loadError, hasAdmin]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
