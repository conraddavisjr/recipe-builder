# Status

Delivery is chunked; each chunk ends with a review checkpoint.
Plan: `~/.claude/plans/ancient-dreaming-bentley.md` (copied here when the build completes).

## Chunk 1: scaffold, config, schema, gate, shell (done 2026-09-10)

Built:
- Next 16 App Router, TypeScript strict, Tailwind v4 theme with light and dark tokens.
- `lib/config.ts`, commented `.env.example`, `lib/supabase/server.ts`.
- `supabase/schema.sql`: settings, profile_selections, instructions, inspirations, runs, recipes, recipe_images, ingredient_art, tasks, `claim_tasks()`, storage buckets.
- `lib/schemas.ts` + `lib/types.ts`, `lib/catalog/` (32 cuisines, 22 flavor profiles, presentation, health, diet absolutes, cookware), `lib/icons.ts`.
- `proxy.ts` password gate with signed cookie, `/login`, `/api/auth/*`.
- App shell: top bar, hamburger nav, right-hand instruction drawer chrome, settings modal chrome, placeholder pages for every route.
- Route handlers: `/api/settings`, `/api/profile`, `/api/instructions`, `/api/instructions/[id]`.

Verified:
- `tsc`, `eslint`, `next build` clean.
- Shell, nav menu, drawer and modal mount correctly in Chrome (drawer/modal confirmed via DOM; animated overlays do not paint in hidden automation tabs).

Not yet verified:
- Any route handler against a real Supabase project (no credentials configured yet).

## Chunk 2: profile wizard, settings, instructions (code complete 2026-09-10)

Built:
- `/profile`: seven-step wizard that doubles as the revisit view; every tile persists on click (optimistic with rollback).
- Settings modal form: every control saves on change; "Run now" starts a manual run.
- Instruction composer (truth vs preference), inline list with edit/mute/delete, right-hand drawer with recipe context, `/instructions` page.

## Chunk 3: queue, generation, imagery, library (code complete 2026-09-10)

Built:
- `lib/ai/`: frozen cached system prompt, pure context builder (tested), streamed structured generation, deterministic guard, low-effort review pass with one repair round, OpenAI image helpers with fixed style anchors.
- `lib/jobs/`: gather, handlers (generate, render image, render ingredient art), sequential drain worker, self re-trigger, due-check (tested).
- Routes: `/api/worker`, `/api/cron/recommend`, `/api/runs`, `/api/runs/[id]`, `/api/runs/[id]/keep`, `/api/recipes`, `/api/recipes/[id]`.
- UI: recipe grid (search, derived filter chips, sort, favorites, polling while a run is live, hover chat icon), detail page (gallery, poetic summary, rationale, icon-tagged steps with legend, ingredient art with serving scaler, equipment icons, rating and feedback, similar column with generate-similar modal), history page with the exact prompt shown to the model, generator page (drafts, keep or discard).

Verified: typecheck, lint, 11 unit tests. Both API keys authenticate.

Not yet verified: anything against a database or a real generation run (local Supabase stack was still pulling images).

## Next

Bring up local Supabase, run the schema, verify chunks 2 and 3 end to end in the browser with one real run.
