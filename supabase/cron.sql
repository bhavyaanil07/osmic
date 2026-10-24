-- Runs the "mailer" server function every 5 minutes (queued emails, deadline reminders, 8 AM summary).
-- __FUNCTIONS_URL__ is replaced by the Deploy backend workflow, e.g. https://abcd.supabase.co/functions/v1
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

insert into public.app_config (key, value) values ('functions_url', '__FUNCTIONS_URL__')
on conflict (key) do update set value = excluded.value;

select cron.schedule(
  'osmic-mailer',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select value from public.app_config where key = 'functions_url') || '/mailer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_config where key = 'cron_secret')
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);
