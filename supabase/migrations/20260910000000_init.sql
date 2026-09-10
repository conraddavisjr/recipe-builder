-- Palate schema. Idempotent: safe to run repeatedly in the Supabase SQL editor.
--
-- Design notes
-- * Single personal workspace today. Every table carries user_id so enabling
--   RLS later is a data migration, not a rewrite (steps at the bottom).
-- * Structured recipe content (ingredients, equipment, steps) lives in jsonb.
--   It is written once by the model and read whole by the UI; there is no
--   query that needs to join into it.
-- * Long-running work is a Postgres task queue drained by the web app in
--   bounded slices. See claim_tasks() below.

create extension if not exists pgcrypto;

-- Keep updated_at honest without every writer remembering to set it.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Settings: one row per user, read fresh at the start of every run.
-- ---------------------------------------------------------------------------
create table if not exists settings (
  user_id text primary key,
  suggestion_count int not null default 5 check (suggestion_count between 1 and 12),
  cadence text not null default 'daily' check (cadence in ('daily', 'weekly')),
  run_hour_utc int not null default 12 check (run_hour_utc between 0 and 23),
  autonomous_enabled boolean not null default false,
  servings int not null default 2 check (servings between 1 and 12),
  max_cook_minutes int not null default 90 check (max_cook_minutes between 10 and 600),
  images_per_recipe int not null default 2 check (images_per_recipe between 1 and 3),
  ingredient_art_enabled boolean not null default true,
  last_run_at timestamptz,
  updated_at timestamptz not null default now()
);
drop trigger if exists settings_updated_at on settings;
create trigger settings_updated_at before update on settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile selections: every toggleable card in the wizard is one row.
-- The wizard and the "revisit" view both just flip `active`.
-- ---------------------------------------------------------------------------
create table if not exists profile_selections (
  user_id text not null,
  category text not null check (category in (
    'cuisine_love', 'cuisine_avoid', 'flavor', 'presentation',
    'health', 'diet_absolute', 'cookware'
  )),
  key text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category, key)
);
drop trigger if exists profile_selections_updated_at on profile_selections;
create trigger profile_selections_updated_at before update on profile_selections
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Instructions to the agent. Two tiers:
--   truth      always sent, never overridden (allergies, hard rules)
--   preference cascading; newer entries win when they contradict older ones
-- recipe_id is optional context: "said while looking at this recipe".
-- ---------------------------------------------------------------------------
create table if not exists instructions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tier text not null check (tier in ('truth', 'preference')),
  body text not null check (length(body) between 1 and 4000),
  recipe_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists instructions_user_created on instructions (user_id, created_at desc);
drop trigger if exists instructions_updated_at on instructions;
create trigger instructions_updated_at before update on instructions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Inspirations: dishes enjoyed at restaurants, with optional photo.
-- `analysis` is the model's research (verified vs inferred, with sources).
-- `user_ingredients` are the user's corrections. Edits never clear analysis;
-- they set analysis_status = 'stale' until a re-analysis merges them.
-- ---------------------------------------------------------------------------
create table if not exists inspirations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  dish_name text not null,
  restaurant_name text not null default '',
  city text not null default '',
  notes text not null default '',
  photo_path text,
  analysis jsonb,
  user_ingredients jsonb not null default '[]'::jsonb,
  analysis_status text not null default 'pending' check (analysis_status in (
    'pending', 'running', 'done', 'stale', 'failed'
  )),
  analysis_error text,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inspirations_user_created on inspirations (user_id, created_at desc);
drop trigger if exists inspirations_updated_at on inspirations;
create trigger inspirations_updated_at before update on inspirations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Runs: one per generation request, whatever triggered it.
-- context_snapshot is exactly what the model was shown, for the history page.
-- ---------------------------------------------------------------------------
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  trigger text not null check (trigger in (
    'scheduled', 'manual', 'generator', 'similar', 'inspiration'
  )),
  status text not null default 'queued' check (status in (
    'queued', 'generating', 'rendering', 'done', 'failed'
  )),
  requested_count int not null default 5,
  prompt text,
  similar_to_id uuid,
  similarity_axes jsonb,
  inspiration_id uuid references inspirations (id) on delete set null,
  context_snapshot jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists runs_user_created on runs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Recipes: the library. status 'candidate' = generator draft not yet kept.
-- ---------------------------------------------------------------------------
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  run_id uuid references runs (id) on delete set null,
  title text not null,
  summary_poetic text not null default '',
  rationale text not null default '',
  cuisine text not null default '',
  dish_type text not null default '',
  health_profile text not null default '',
  presentation text not null default '',
  tags text[] not null default '{}',
  flavor_tags text[] not null default '{}',
  servings int not null default 2,
  active_minutes int not null default 0,
  total_minutes int not null default 0,
  difficulty text not null default 'medium',
  ingredients jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  image_prompts jsonb not null default '[]'::jsonb,
  source text not null check (source in ('autonomous', 'generator', 'similar', 'inspiration')),
  similar_to_id uuid references recipes (id) on delete set null,
  inspiration_id uuid references inspirations (id) on delete set null,
  status text not null default 'saved' check (status in ('candidate', 'saved')),
  favorite boolean not null default false,
  rating int check (rating between 1 and 5),
  feedback text,
  feedback_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recipes_user_status_created on recipes (user_id, status, created_at desc);
drop trigger if exists recipes_updated_at on recipes;
create trigger recipes_updated_at before update on recipes
  for each row execute function set_updated_at();

-- Generated food photography, 1 to 3 per recipe. Rows exist before the bytes
-- do, so the UI can show a placeholder that fills in.
create table if not exists recipe_images (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  kind text not null check (kind in ('hero', 'angle', 'plated')),
  position int not null default 0,
  prompt text not null,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  error text,
  created_at timestamptz not null default now()
);
create index if not exists recipe_images_recipe on recipe_images (recipe_id, position);

-- Illustrated ingredient art, cached by normalized ingredient key and shared
-- across every recipe. This is the single biggest image-cost saver.
create table if not exists ingredient_art (
  ingredient_key text primary key,
  display_name text not null,
  prompt text not null,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists ingredient_art_updated_at on ingredient_art;
create trigger ingredient_art_updated_at before update on ingredient_art
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Task queue. Claimed with FOR UPDATE SKIP LOCKED so overlapping worker
-- invocations never double-process. A task locked for more than 10 minutes is
-- treated as abandoned and re-claimable, which is how a killed function
-- invocation recovers.
-- ---------------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs (id) on delete cascade,
  type text not null check (type in (
    'generate_recipes', 'render_recipe_image', 'render_ingredient_art',
    'analyze_inspiration', 'reanalyze_ingredients', 'cleanup_candidates'
  )),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  locked_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists tasks_status_created on tasks (status, created_at);
create index if not exists tasks_run on tasks (run_id);

create or replace function claim_tasks(p_limit int default 1)
returns setof tasks language plpgsql as $$
begin
  -- Recover abandoned work first.
  update tasks
     set status = 'queued', locked_at = null
   where status = 'running' and locked_at < now() - interval '10 minutes';

  return query
  with picked as (
    select id from tasks
     where status = 'queued'
     order by created_at
     limit p_limit
     for update skip locked
  )
  update tasks t
     set status = 'running', locked_at = now(), attempts = t.attempts + 1
    from picked
   where t.id = picked.id
  returning t.*;
end $$;

-- ---------------------------------------------------------------------------
-- Storage buckets. Generated imagery is public-read (it is not sensitive and
-- <img> tags need plain URLs). Uploaded restaurant photos stay private and are
-- served through short-lived signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true),
       ('ingredient-art', 'ingredient-art', true),
       ('inspiration-photos', 'inspiration-photos', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Enabling RLS later (when a second person joins):
--   1. Replace user_id text with auth.uid()::text defaults.
--   2. alter table <each> enable row level security;
--   3. create policy owner_only on <each> using (user_id = auth.uid()::text);
--   4. Swap the service role key in lib/supabase/server.ts for per-request
--      user tokens. Until then the service role key bypasses RLS by design.
-- ---------------------------------------------------------------------------
