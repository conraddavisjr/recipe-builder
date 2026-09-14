-- Persisted pregnancy-safety verdict per recipe, so a large library can be
-- badged and filtered by an indexed column instead of scanning step text on
-- every request. Computed by the deterministic guard (lib/ai/guard.ts) when
-- a recipe is stored, and recomputed for the whole library by
-- POST /api/recipes/reindex when the rules change.
alter table recipes add column if not exists pregnancy_safe boolean not null default false;
create index if not exists recipes_pregnancy_safe on recipes (user_id, pregnancy_safe) where pregnancy_safe;
