-- Shopping runs: a gather cart of recipes that becomes a request for the
-- agent to fill the person's grocery cart, then a history entry.
--
-- status: gathering  = the one open cart recipes are added to
--         requested  = "Shop for me" pressed; list frozen in `items`
--         shopping   = an agent is working through it
--         done       = finished; `items` carries per-line results
--         failed     = the agent could not complete it (see `notes`)

create table if not exists shopping_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null default '',
  store text not null default 'whole_foods',
  status text not null default 'gathering' check (status in ('gathering', 'requested', 'shopping', 'done', 'failed')),
  skip_staples boolean not null default true,
  items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  requested_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shopping_runs_user_status on shopping_runs (user_id, status, created_at desc);
drop trigger if exists shopping_runs_updated_at on shopping_runs;
create trigger shopping_runs_updated_at before update on shopping_runs
  for each row execute function set_updated_at();

create table if not exists shopping_run_recipes (
  run_id uuid not null references shopping_runs (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (run_id, recipe_id)
);
