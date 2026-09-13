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

Verified 2026-09-10 against the local Supabase stack (`npx supabase start`, analytics disabled, edge-runtime/realtime/mailpit excluded):
- Wizard tiles persist per click and derived flavors follow loved cuisines; settings save from the modal; instructions save from the drawer in both tiers.
- "Run now" produced 3 recipes in one Opus 5 call (no constraint issues), photos and ingredient art rendered through the queue, grid polled them in live, detail page shows icon-tagged segments, rating and feedback persist, similarity column populated.
- Queue fixes found in the run: food photos are enqueued before ingredient art; interactive tasks (generation, analysis) are claimed ahead of rendering; a dev-only heartbeat in `instrumentation.ts` replaces pg_cron locally.

## Chunk 4: inspirations (code complete 2026-09-10)

Built:
- `/inspirations`: add form with direct-to-storage photo upload (signed upload URL, browser PUT), list with live status.
- `/inspirations/[id]`: research panel (restaurant and dish verification, menu quote, photo observations, flavor, techniques, sources), ingredient list with verified / inferred / user-provided provenance and confidence, corrections editor, "Re-analyze with my corrections", "Research again", "Cook this at home", delete.
- `lib/ai/analyzeInspiration.ts`: manual loop with `web_search_20260209` + `web_fetch_20260209` and the photo as an image block, `pause_turn` handled, then a parse call into the analysis schema; `reanalyzeIngredients` folds corrections in with provenance kept.
- Saving an inspiration queues research automatically; editing marks analysis stale instead of clearing it.

Verified 2026-09-10 in the browser and API:
- Khao Soi at Dee Dee (Austin): restaurant and dish verified with 9 sources; a deliberately mismatched test (Korean dish name, Sichuan restaurant, Vietnamese-looking photo uploaded direct to storage) was reported as a three-way mismatch rather than invented.
- Correction "Chicken thigh, bone-in" saved from the UI, re-analysis marked it user_provided and derived the implied ingredients and techniques.
- "Cook this at home" started an inspiration run from the detail page.

## Chunk 5: generator, similar, history (verified 2026-09-10)

- Generator: prompt asking for a pizza oven the profile does not own; the review pass flagged both drafts, the repair round rebuilt them around owned cookware, rationale explains the substitution. Kept one draft, the other was deleted with its images. Page resumes an unfinished generator run on load.
- History: status, progress, produced recipes, review outcome, token usage, and the exact prompt.
- Fixes from live use: run settlement moved into the worker (a handler cannot see its own task as done) plus a self-healing sweep; CSS primitives moved into `@layer components` so utilities override them.

## Restyle: Savour design system applied (2026-09-10)

Two agents studied the sibling build: `docs/design/design-system.md` (creative director: tokens, type, components, motion, what to avoid, drop-in CSS) and `docs/design/usability-guardrails.md` (keep list, density diagnosis, step-segment redesign, acceptance checklist).
Applied:
- Ivory paper, forest-green ink, olive as the only accent; flat bordered cards with hover-only lift; two-line serif page headings with an olive italic phrase; tracked eyebrows; ink-filled primary pills. Derived dark palette keeps the forest temperature.
- Steps render as prose with a monochrome facts strip (time, temperature, equipment, technique) under each title; only time and temperature are inline marks; "Show tags" restores the chip rendering and legend and persists in localStorage.
- Cards show one eyebrow (cuisine and dish type), no pills; each filter group is a single-click dropdown whose button shows the chosen value; three-column grid; chat icon in the meta row with hover, focus and touch reveal.
- Light theme only, by request: the dark palette was removed and `color-scheme` is pinned to light.
- Filter groups and their options carry glyphs (`FILTER_GROUP_ICONS`, `filterOptionIcon` in `lib/icons.ts`; cuisines reuse the catalog icons, dish types use a keyword matcher).
- Recipes can be deleted from the detail page behind an in-app confirmation (`components/ui/ConfirmDialog.tsx`, `DELETE /api/recipes/[id]`); images are removed from storage with the row.
- Detail page reading order: title, summary, actions, photo, stats strip, rationale, ingredients (two columns, equipment in the footer), method, feedback last; compact similar rows in a sticky column.
- Wizard: horizontal stepper with counts, neutral inactive tiles, compact tiles for avoid and cookware, one-line descriptions that expand on hover.
- Settings uses headings and dividers; instruction controls reveal on hover; inspiration provenance is a glyph with bar and label on hover.

## Groups, checklists, safe keep flow (2026-09-11)

- Generator "Keep" now writes `status=saved` immediately (`POST /api/recipes/[id]/keep`); unkept drafts persist; discarding is explicit and confirmed (`POST /api/runs/[id]/discard`, refuses saved recipes). The old keep route that deleted unselected drafts is gone. Three recipes from run `dc787a36` were lost to it before the fix; a recovery run recreated them by title.
- Groups (`groups`, `group_recipes`): create from `/groups` or the recipe page popover; group page shows recipes and a consolidated shopping list (`lib/groups.ts`, tested) with checkboxes.
- Ingredient checklist on recipes; both checklists persist per browser in localStorage.
- Cards and the stats strip show when a recipe was added; library sorts newest first by default; the library notes waiting drafts; a top-bar pill shows any live run.
- `npm run db:backup` dumps the local database.

## Deployed and on Google sign-in (2026-09-12)

- Hosted Supabase project "Recipe Builder" (`nbkbvxwmmaruuujeaqmz`, us-east-1) with the local library carried over; Vercel production at https://recipe-builder-theta.vercel.app; pg_cron heartbeat and daily Vercel cron in place. Local dev points at the hosted database too.
- The password gate is replaced by Google sign-in through Supabase Auth with an email allowlist (`ALLOWED_EMAILS`). `proxy.ts` verifies the session and the allowlist; `/auth/callback` exchanges the OAuth code; unapproved accounts are signed out with a message. The Google OAuth client must be created in Google Cloud Console and pushed with `supabase config push`.
- `POST /api/runs/import` lets a batch authored outside the model call enter the same pipeline (used while the Anthropic balance is empty).

## Shopping (2026-09-13)

- `shopping_runs` + `shopping_run_recipes`: one open gather cart, "Shop for me" freezes the consolidated list (staples separated) into a requested run, agents report per-item results via `POST /api/shopping/[id]/complete` (bearer), history with rename and "Shop this again".
- UI: `/shop`, basket in the top bar and menu, "Add to shopping" on recipes, "Add all to shopping" on groups.
- Fulfilment is manual-by-agent (Claude Code driving Chrome) because Amazon has no cart API; procedure in `AGENTS.md`.

## Known limitations

- Image rendering is sequential per worker slice; a 5-recipe run with a cold ingredient-art cache takes 10-15 minutes locally. Concurrent slices (heartbeat plus self-kick) already overlap safely.
- No pg_cron registered yet (production only); locally `instrumentation.ts` heartbeats the worker.
- Similarity is structured scoring, not embeddings; add pgvector if the library grows past a few hundred recipes.
- Single owner; RLS off by design (steps documented in the migration).

## Next

Chunk 6 (deploy) is deferred by request; the app runs entirely on the local Supabase stack. Chunk 7 polish continues opportunistically.
