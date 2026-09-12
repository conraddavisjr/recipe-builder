-- Cloud heartbeat for the task queue.
--
-- Vercel functions cannot run forever, so the queue is drained by short
-- worker invocations. This job pokes POST /api/worker every minute, using
-- two Vault secrets set after deploy:
--   select vault.create_secret('https://<your-app>.vercel.app', 'palate_worker_url');
--   select vault.create_secret('<WORKER_SECRET>', 'palate_worker_secret');
-- Until both exist the job is a harmless no-op. Locally, instrumentation.ts
-- does the same thing in-process, and this migration is skipped if the
-- extensions are unavailable.

do $$
begin
  create extension if not exists pg_cron;
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_cron or pg_net unavailable here; heartbeat not installed';
  return;
end $$;

create or replace function palate_poke_worker()
returns void language plpgsql security definer as $$
declare
  url text;
  secret text;
begin
  select decrypted_secret into url from vault.decrypted_secrets where name = 'palate_worker_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'palate_worker_secret';
  if url is null or secret is null then return; end if;
  perform net.http_post(
    url := url || '/api/worker',
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'palate-worker-heartbeat';
    perform cron.schedule('palate-worker-heartbeat', '* * * * *', 'select palate_poke_worker()');
  end if;
end $$;
