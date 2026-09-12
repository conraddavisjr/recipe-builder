-- Groups: named collections of recipes ("Thanksgiving", "Weeknight soups").
-- A group's shopping list is derived at read time by consolidating the
-- ingredients of its recipes, so nothing here duplicates recipe content.

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null check (length(name) between 1 and 120),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists groups_user_created on groups (user_id, created_at desc);
drop trigger if exists groups_updated_at on groups;
create trigger groups_updated_at before update on groups
  for each row execute function set_updated_at();

create table if not exists group_recipes (
  group_id uuid not null references groups (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, recipe_id)
);
create index if not exists group_recipes_recipe on group_recipes (recipe_id);
