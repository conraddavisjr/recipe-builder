-- Step media: one still or one short clip per recipe step, so the sequence
-- of a method can be seen, not only read. Prompts are written to resolve
-- what the prose leaves implicit (what stays in the pan, what a "well" is).
--
-- kind:   image = 3:2 still from the image model
--         video = short clip from the video model (provider_job_id tracks
--                 the asynchronous job across worker slices)
-- status: pending -> done | failed

create table if not exists step_media (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  step_number int not null,
  kind text not null check (kind in ('image', 'video')),
  prompt text not null,
  model text not null default '',
  seconds int,
  provider_job_id text,
  storage_path text,
  poster_path text,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, step_number, kind)
);
create index if not exists step_media_recipe on step_media (recipe_id, kind, step_number);
drop trigger if exists step_media_updated_at on step_media;
create trigger step_media_updated_at before update on step_media
  for each row execute function set_updated_at();

-- Two new task types for the queue.
alter table tasks drop constraint if exists tasks_type_check;
alter table tasks add constraint tasks_type_check check (type in (
  'generate_recipes', 'render_recipe_image', 'render_ingredient_art',
  'analyze_inspiration', 'reanalyze_ingredients', 'cleanup_candidates',
  'render_step_image', 'render_step_video'
));
