-- =====================================================================
-- OSMIC portal database (Supabase / Postgres)
-- Safe to run more than once: every statement checks before it creates.
-- Run by the "Deploy backend" GitHub workflow, or paste into
-- Supabase > SQL Editor > New query > Run.
-- =====================================================================

create schema if not exists private;   -- internal helpers, not reachable from the website

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  roll text not null default '',
  mobile text not null default '',
  whatsapp text not null default '',
  photo_path text,
  role text not null default 'member' check (role in ('admin', 'lead', 'member')),
  lead_id uuid references public.profiles (id) on delete set null,
  active boolean not null default true,
  joined_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));
create unique index if not exists profiles_roll_key on public.profiles (upper(roll)) where roll <> '';
create index if not exists profiles_lead_idx on public.profiles (lead_id);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  roll text not null check (length(trim(roll)) between 3 and 40),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  mobile text not null check (mobile ~ '^[0-9]{10}$'),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  photo_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  lead_id uuid references public.profiles (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  applied_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null
);

-- The attendance code lives in its own table that nobody can read directly,
-- so members can't look it up; the admin gets it through session_code().
create table if not exists public.session_codes (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  code text not null
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  marked_at timestamptz not null default now(),
  verified_by uuid references public.profiles (id) on delete set null,
  unique (session_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  deadline date not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (task_id, user_id)
);
create index if not exists task_assignees_user_idx on public.task_assignees (user_id);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  link text not null default '',
  file_path text,
  file_name text not null default '',
  note text not null default '',
  submitted_at timestamptz not null default now(),
  verdict text not null default 'pending' check (verdict in ('pending', 'pass', 'fail')),
  comment text not null default '',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  check (link <> '' or file_path is not null)
);
create index if not exists submissions_task_user_idx on public.submissions (task_id, user_id);

create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text not null check (length(trim(reason)) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text not null default '',
  applied_at timestamptz not null default now(),
  decided_by uuid references public.profiles (id) on delete set null,
  check (to_date >= from_date)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  message text not null default '',
  emailed boolean not null default false,
  posted_by uuid references public.profiles (id) on delete set null,
  posted_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  link text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- Face ID / fingerprint keys (public half only; the private half never leaves the device).
create table if not exists public.passkeys (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device text not null default '',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Emails waiting to be sent by the "mailer" server function.
create table if not exists public.outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  to_emails text[] not null,
  subject text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts int not null default 0,
  last_error text
);
create index if not exists outbox_unsent_idx on public.outbox (created_at) where sent_at is null;

-- Server-only tables (no one can read these from the website).
create table if not exists public.app_config (key text primary key, value text not null);
create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,
  user_id uuid,
  kind text not null check (kind in ('register', 'login')),
  expires_at timestamptz not null default now() + interval '5 minutes'
);
create table if not exists public.reminder_log (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (task_id, user_id)
);
create table if not exists public.job_runs (job text primary key, last_run date not null);

-- A random secret that the scheduled mailer job uses to prove it's really the scheduler.
insert into public.app_config (key, value)
values ('cron_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- Helper functions used by the security rules
-- (security definer = they can look things up without being blocked by the rules themselves)
-- ---------------------------------------------------------------------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() is not null
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin', 'lead'), false)
$$;

create or replace function public.lead_of(p_user uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select lead_id from public.profiles where id = p_user
$$;

-- Can the signed-in person see this member's records? (self, the admin, or their club lead)
create or replace function public.can_view(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_user = auth.uid()
      or public.is_admin()
      or (public.my_role() = 'lead' and public.lead_of(p_user) = auth.uid())
$$;

-- Can the signed-in person make decisions about this member? (admin, or their club lead; never yourself)
create or replace function public.can_manage(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_user <> auth.uid()
     and (public.is_admin() or (public.my_role() = 'lead' and public.lead_of(p_user) = auth.uid()))
$$;

create or replace function public.task_creator(p_task uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select created_by from public.tasks where id = p_task
$$;

create or replace function public.is_assigned(p_task uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.task_assignees where task_id = p_task and user_id = p_user)
$$;

-- ---------------------------------------------------------------------
-- Internal helpers: notifications and queued emails (not callable from the website)
-- ---------------------------------------------------------------------

create or replace function private.notify(p_user uuid, p_text text, p_link text default '') returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, text, link) values (p_user, p_text, coalesce(p_link, ''))
$$;

create or replace function private.queue_email(p_kind text, p_to text[], p_subject text, p_payload jsonb default '{}') returns void
language sql security definer set search_path = public as $$
  insert into public.outbox (kind, to_emails, subject, payload)
  select p_kind, p_to, p_subject, coalesce(p_payload, '{}')
  where coalesce(array_length(p_to, 1), 0) > 0
$$;

create or replace function private.admin_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where role = 'admin' and active
$$;

revoke all on function private.notify(uuid, text, text) from public;
revoke all on function private.queue_email(text, text[], text, jsonb) from public;
revoke all on function private.admin_ids() from public;

-- ---------------------------------------------------------------------
-- Row level security: who can read and change what
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.sessions enable row level security;
alter table public.session_codes enable row level security;
alter table public.attendance enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.submissions enable row level security;
alter table public.leaves enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.passkeys enable row level security;
alter table public.outbox enable row level security;
alter table public.app_config enable row level security;
alter table public.webauthn_challenges enable row level security;
alter table public.reminder_log enable row level security;
alter table public.job_runs enable row level security;
-- session_codes, app_config, webauthn_challenges, reminder_log, job_runs have no policies:
-- only the server (service role) can touch them.

-- profiles: you see yourself, the admin and club leads; a lead also sees their team and
-- members without a lead (to add them); the admin sees everyone. Only the admin edits.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or (public.is_active_user() and role in ('admin', 'lead'))
  or (public.my_role() = 'lead' and (lead_id = auth.uid() or (lead_id is null and role = 'member')))
);
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- applications: only the admin (new ones come in through submit_application()).
drop policy if exists "applications admin read" on public.applications;
create policy "applications admin read" on public.applications for select to authenticated using (public.is_admin());
drop policy if exists "applications admin update" on public.applications;
create policy "applications admin update" on public.applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "applications admin delete" on public.applications;
create policy "applications admin delete" on public.applications for delete to authenticated using (public.is_admin());

-- sessions: everyone signed in can see them; only the admin runs them.
drop policy if exists "sessions read" on public.sessions;
create policy "sessions read" on public.sessions for select to authenticated using (public.is_active_user());
drop policy if exists "sessions admin update" on public.sessions;
create policy "sessions admin update" on public.sessions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "sessions admin delete" on public.sessions;
create policy "sessions admin delete" on public.sessions for delete to authenticated using (public.is_admin());

-- attendance: you, your lead and the admin can see it; only the admin verifies (members use mark_attendance()).
drop policy if exists "attendance read" on public.attendance;
create policy "attendance read" on public.attendance for select to authenticated using (public.can_view(user_id));
drop policy if exists "attendance admin update" on public.attendance;
create policy "attendance admin update" on public.attendance for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "attendance admin delete" on public.attendance;
create policy "attendance admin delete" on public.attendance for delete to authenticated using (public.is_admin());

-- tasks: staff see all tasks; members see the tasks given to them. Created through create_task().
drop policy if exists "tasks read" on public.tasks;
create policy "tasks read" on public.tasks for select to authenticated using (
  public.is_staff() or public.is_assigned(id, auth.uid())
);
drop policy if exists "tasks delete" on public.tasks;
create policy "tasks delete" on public.tasks for delete to authenticated using (
  public.is_admin() or (public.is_staff() and created_by = auth.uid())
);

drop policy if exists "task assignees read" on public.task_assignees;
create policy "task assignees read" on public.task_assignees for select to authenticated using (
  public.can_view(user_id) or public.task_creator(task_id) = auth.uid()
);

-- submissions: you hand in your own work; your lead or the admin marks it.
drop policy if exists "submissions read" on public.submissions;
create policy "submissions read" on public.submissions for select to authenticated using (public.can_view(user_id));
drop policy if exists "submissions insert own" on public.submissions;
create policy "submissions insert own" on public.submissions for insert to authenticated with check (
  user_id = auth.uid() and public.is_active_user() and public.is_assigned(task_id, auth.uid())
  and verdict = 'pending' and reviewed_by is null and comment = ''
);
drop policy if exists "submissions review" on public.submissions;
create policy "submissions review" on public.submissions for update to authenticated
  using (public.can_manage(user_id)) with check (public.can_manage(user_id));

-- leave: you apply for yourself; your lead or the admin decides.
drop policy if exists "leaves read" on public.leaves;
create policy "leaves read" on public.leaves for select to authenticated using (public.can_view(user_id));
drop policy if exists "leaves insert own" on public.leaves;
create policy "leaves insert own" on public.leaves for insert to authenticated with check (
  user_id = auth.uid() and public.is_active_user() and status = 'pending' and decided_by is null
);
drop policy if exists "leaves decide" on public.leaves;
create policy "leaves decide" on public.leaves for update to authenticated
  using (public.can_manage(user_id)) with check (public.can_manage(user_id));

-- announcements: everyone signed in reads; staff post; the admin or the author deletes.
drop policy if exists "announcements read" on public.announcements;
create policy "announcements read" on public.announcements for select to authenticated using (public.is_active_user());
drop policy if exists "announcements post" on public.announcements;
create policy "announcements post" on public.announcements for insert to authenticated with check (
  public.is_staff() and posted_by = auth.uid()
);
drop policy if exists "announcements delete" on public.announcements;
create policy "announcements delete" on public.announcements for delete to authenticated using (
  public.is_admin() or posted_by = auth.uid()
);

-- notifications: your own only.
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- passkeys: you see and remove your own (adding goes through the server, which checks the scan).
drop policy if exists "passkeys own read" on public.passkeys;
create policy "passkeys own read" on public.passkeys for select to authenticated using (user_id = auth.uid());
drop policy if exists "passkeys own delete" on public.passkeys;
create policy "passkeys own delete" on public.passkeys for delete to authenticated using (user_id = auth.uid());

-- outbox: the admin can see which emails went out.
drop policy if exists "outbox admin read" on public.outbox;
create policy "outbox admin read" on public.outbox for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- Actions the website calls (each one checks who is asking)
-- ---------------------------------------------------------------------

-- Is there an admin yet? (The portal shows "Set up the first admin" until there is.)
create or replace function public.has_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where role = 'admin')
$$;

-- Public "Apply to join" form.
create or replace function public.submit_application(
  p_name text, p_roll text, p_email text, p_mobile text, p_whatsapp text, p_photo_path text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_roll text := upper(trim(p_roll));
  v_id uuid;
begin
  if exists (select 1 from public.profiles where lower(email) = v_email or (roll <> '' and upper(roll) = v_roll)) then
    raise exception 'An account with this email or roll number already exists.';
  end if;
  if exists (select 1 from public.applications where status = 'pending' and (lower(email) = v_email or upper(roll) = v_roll)) then
    raise exception 'An application with this email or roll number is already waiting for the admin.';
  end if;
  if (select count(*) from public.applications where applied_at > now() - interval '1 hour') >= 60 then
    raise exception 'Too many applications right now. Please try again in a little while.';
  end if;
  if p_photo_path is not null and p_photo_path !~ '^applications/[A-Za-z0-9_.-]+$' then
    raise exception 'Invalid photo.';
  end if;
  insert into public.applications (name, roll, email, mobile, whatsapp, photo_path)
  values (trim(p_name), v_roll, v_email, regexp_replace(p_mobile, '\D', '', 'g'), regexp_replace(p_whatsapp, '\D', '', 'g'), p_photo_path)
  returning id into v_id;
  return v_id;
end $$;

-- Admin: open an attendance session with a fresh 6-character code.
create or replace function public.start_session(p_title text, p_minutes int) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_id uuid;
  i int;
begin
  if not public.is_admin() then raise exception 'Only the admin runs attendance.'; end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 180 then raise exception 'Choose between 1 and 180 minutes.'; end if;
  update public.sessions set closed_at = now() where closed_at is null;
  for i in 1..6 loop
    v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  insert into public.sessions (title, expires_at, created_by)
  values (coalesce(nullif(trim(p_title), ''), 'Session on ' || to_char(now() at time zone 'Asia/Kolkata', 'Mon DD')),
          now() + make_interval(mins => p_minutes), auth.uid())
  returning id into v_id;
  insert into public.session_codes (session_id, code) values (v_id, v_code);
  return json_build_object('id', v_id, 'code', v_code);
end $$;

-- Admin: read the code of a session.
create or replace function public.session_code(p_session uuid) returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only the admin can see the code.'; end if;
  return (select code from public.session_codes where session_id = p_session);
end $$;

-- Member: step 1 of attendance (the admin verifies afterwards).
create or replace function public.mark_attendance(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.sessions;
begin
  if not public.is_active_user() then raise exception 'Please log in again.'; end if;
  select * into s from public.sessions order by started_at desc limit 1;
  if s.id is null or s.closed_at is not null or s.expires_at <= now() then
    raise exception 'No session is open right now.';
  end if;
  if exists (select 1 from public.attendance where session_id = s.id and user_id = auth.uid()) then
    raise exception 'You have already checked in for this session.';
  end if;
  if upper(trim(coalesce(p_code, ''))) <> (select code from public.session_codes where session_id = s.id) then
    raise exception 'Wrong code. Check the screen and try again.';
  end if;
  insert into public.attendance (session_id, user_id) values (s.id, auth.uid());
end $$;

-- Admin: verify every pending check-in of a session.
create or replace function public.verify_all_pending(p_session uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Only the admin verifies attendance.'; end if;
  update public.attendance set status = 'verified', verified_by = auth.uid()
  where session_id = p_session and status = 'pending';
  get diagnostics n = row_count;
  return n;
end $$;

-- Admin or club lead: create a task and assign it (a lead can only assign their own team).
create or replace function public.create_task(p_title text, p_description text, p_deadline date, p_assignees uuid[]) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_task uuid;
  v_ids uuid[];
  v_emails text[];
  v_creator text;
begin
  if not public.is_staff() then raise exception 'Only the admin and club leads can assign tasks.'; end if;
  if p_deadline is null or p_deadline < (now() at time zone 'Asia/Kolkata')::date then raise exception 'Pick a deadline from today onwards.'; end if;
  select array_agg(p.id), array_agg(p.email) into v_ids, v_emails
  from public.profiles p
  where p.id = any (p_assignees) and p.active and p.role <> 'admin' and p.id <> auth.uid()
    and (public.is_admin() or p.lead_id = auth.uid());
  if coalesce(array_length(v_ids, 1), 0) = 0 then raise exception 'Choose at least one member from your team.'; end if;
  insert into public.tasks (title, description, deadline, created_by)
  values (trim(p_title), coalesce(trim(p_description), ''), p_deadline, auth.uid())
  returning id into v_task;
  insert into public.task_assignees (task_id, user_id) select v_task, unnest(v_ids);
  select name into v_creator from public.profiles where id = auth.uid();
  perform private.notify(x, 'New task: ' || trim(p_title), '/member/tasks') from unnest(v_ids) as x;
  perform private.queue_email('new_task', v_emails, 'New OSMIC task: ' || trim(p_title),
    jsonb_build_object('title', trim(p_title), 'description', coalesce(trim(p_description), ''), 'deadline', p_deadline, 'by', v_creator));
  return json_build_object('id', v_task, 'count', array_length(v_ids, 1));
end $$;

-- Club lead: take an unassigned member into your team / let one go.
create or replace function public.add_to_my_team(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'lead' then raise exception 'Only club leads have a team.'; end if;
  update public.profiles set lead_id = auth.uid()
  where id = p_user and role = 'member' and active and lead_id is null;
  if not found then raise exception 'This member is already in a team.'; end if;
end $$;

create or replace function public.remove_from_my_team(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set lead_id = null where id = p_user and lead_id = auth.uid();
  if not found then raise exception 'This member is not in your team.'; end if;
end $$;

-- Mark all of your notifications as read.
create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read = true where user_id = auth.uid() and not read
$$;

-- Server only (mailer): check the scheduler's secret.
create or replace function public.check_cron_secret(p_secret text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_config where key = 'cron_secret' and value = p_secret)
$$;
revoke all on function public.check_cron_secret(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Automatic notifications and emails
-- ---------------------------------------------------------------------

create or replace function private.on_profile_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_lead text;
begin
  if tg_op = 'INSERT' then
    if new.lead_id is not null then
      perform private.notify(new.lead_id, new.name || ' joined your team', '/lead/team');
    end if;
    return new;
  end if;
  -- promoted to club lead
  if new.role = 'lead' and old.role <> 'lead' then
    update public.profiles set lead_id = null where id = new.id and lead_id is not null;
    perform private.notify(new.id, 'You are now a club lead', '/lead');
    perform private.queue_email('now_lead', array[new.email], 'You are now an OSMIC club lead', jsonb_build_object('name', new.name));
  end if;
  -- no longer a club lead: their team needs a new lead
  if old.role = 'lead' and new.role <> 'lead' then
    update public.profiles set lead_id = null where lead_id = new.id;
  end if;
  -- moved to a (new) club lead
  if new.lead_id is not null and new.lead_id is distinct from old.lead_id then
    select name into v_lead from public.profiles where id = new.lead_id;
    perform private.notify(new.lead_id, new.name || ' joined your team', '/lead/team');
    perform private.notify(new.id, coalesce(v_lead, 'Someone') || ' is now your club lead', '/member');
  end if;
  return new;
end $$;
drop trigger if exists profiles_changed on public.profiles;
create trigger profiles_changed after insert or update on public.profiles
  for each row execute function private.on_profile_change();

create or replace function private.on_application_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'rejected' and old.status <> 'rejected' then
    new.decided_at := now();
    perform private.queue_email('application_rejected', array[new.email], 'Your OSMIC application', jsonb_build_object('name', new.name));
  end if;
  return new;
end $$;
drop trigger if exists applications_changed on public.applications;
create trigger applications_changed before update on public.applications
  for each row execute function private.on_application_change();

create or replace function private.on_attendance_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.status <> old.status and new.status in ('verified', 'rejected') then
    select title into v_title from public.sessions where id = new.session_id;
    perform private.notify(new.user_id,
      case when new.status = 'verified' then 'Attendance verified for ' else 'Attendance rejected for ' end || coalesce(v_title, 'the session'),
      '/member/attendance');
  end if;
  return new;
end $$;
drop trigger if exists attendance_changed on public.attendance;
create trigger attendance_changed after update on public.attendance
  for each row execute function private.on_attendance_change();

create or replace function private.on_submission_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_task text;
  v_name text;
  v_email text;
  v_lead uuid;
begin
  select title into v_task from public.tasks where id = new.task_id;
  select name, email, lead_id into v_name, v_email, v_lead from public.profiles where id = new.user_id;
  if tg_op = 'INSERT' then
    if v_lead is not null then
      perform private.notify(v_lead, v_name || ' submitted ' || v_task, '/lead/tasks');
    else
      perform private.notify(a, v_name || ' submitted ' || v_task, '/admin/tasks') from private.admin_ids() as a;
    end if;
  elsif new.verdict <> old.verdict and new.verdict in ('pass', 'fail') then
    perform private.notify(new.user_id, 'Your ' || v_task || ' was marked ' || initcap(new.verdict), '/member/tasks');
    perform private.queue_email('task_result', array[v_email], 'Result for ' || v_task || ': ' || initcap(new.verdict),
      jsonb_build_object('name', v_name, 'task', v_task, 'verdict', new.verdict, 'comment', new.comment));
  end if;
  return new;
end $$;
drop trigger if exists submissions_changed on public.submissions;
create trigger submissions_changed after insert or update on public.submissions
  for each row execute function private.on_submission_change();

-- Stamp who reviewed and when (can't be faked from the browser).
create or replace function private.stamp_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.verdict <> old.verdict then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists submissions_stamp on public.submissions;
create trigger submissions_stamp before update on public.submissions
  for each row execute function private.stamp_review();

create or replace function private.on_leave_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_email text;
  v_lead uuid;
begin
  select name, email, lead_id into v_name, v_email, v_lead from public.profiles where id = new.user_id;
  if tg_op = 'INSERT' then
    if v_lead is not null then
      perform private.notify(v_lead, v_name || ' applied for leave', '/lead/leaves');
    else
      perform private.notify(a, v_name || ' applied for leave', '/admin/leaves') from private.admin_ids() as a;
    end if;
  elsif new.status <> old.status and new.status in ('approved', 'rejected') then
    perform private.notify(new.user_id, 'Your leave for ' || to_char(new.from_date, 'Mon DD') || ' was ' || new.status, '/member/leave');
    perform private.queue_email('leave_decision', array[v_email], 'Leave ' || new.status,
      jsonb_build_object('name', v_name, 'from', new.from_date, 'to', new.to_date, 'status', new.status, 'note', new.note));
  end if;
  return new;
end $$;
drop trigger if exists leaves_changed on public.leaves;
create trigger leaves_changed after insert or update on public.leaves
  for each row execute function private.on_leave_change();

create or replace function private.stamp_leave() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status then new.decided_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists leaves_stamp on public.leaves;
create trigger leaves_stamp before update on public.leaves
  for each row execute function private.stamp_leave();

create or replace function private.stamp_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status then new.verified_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists attendance_stamp on public.attendance;
create trigger attendance_stamp before update on public.attendance
  for each row execute function private.stamp_attendance();

create or replace function private.on_announcement() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to text[];
begin
  if new.emailed then
    select array_agg(email) into v_to from public.profiles where active and id <> coalesce(new.posted_by, '00000000-0000-0000-0000-000000000000');
    perform private.queue_email('announcement', v_to, 'OSMIC: ' || new.title,
      jsonb_build_object('title', new.title, 'message', new.message,
        'by', (select name from public.profiles where id = new.posted_by)));
  end if;
  return new;
end $$;
drop trigger if exists announcements_posted on public.announcements;
create trigger announcements_posted after insert on public.announcements
  for each row execute function private.on_announcement();

-- ---------------------------------------------------------------------
-- Live updates: the portal refreshes when these tables change
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['profiles', 'applications', 'sessions', 'attendance', 'tasks', 'task_assignees',
                             'submissions', 'leaves', 'announcements', 'notifications', 'passkeys', 'outbox'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- File storage: photos and task submissions (both private)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Anyone may upload an application photo (into applications/); members of the club can view photos.
drop policy if exists "osmic photos upload" on storage.objects;
create policy "osmic photos upload" on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'photos' and (storage.foldername(name))[1] = 'applications'
);
drop policy if exists "osmic photos read" on storage.objects;
create policy "osmic photos read" on storage.objects for select to authenticated using (
  bucket_id = 'photos' and public.is_active_user()
);

-- Task files go in submissions/<your id>/...; you, your lead and the admin can open them.
drop policy if exists "osmic submissions upload" on storage.objects;
create policy "osmic submissions upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'submissions' and public.is_active_user() and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "osmic submissions read" on storage.objects;
create policy "osmic submissions read" on storage.objects for select to authenticated using (
  bucket_id = 'submissions' and public.can_view(((storage.foldername(name))[1])::uuid)
);
