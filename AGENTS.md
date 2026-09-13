<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Palate agent notes

Read `README.md` for architecture and `docs/STATUS.md` for what is built and verified before changing anything.

Conventions that are deliberate:
- Client components fetch route handlers; route handlers call `lib/db.ts`; nothing else touches Supabase.
- `lib/config.ts` is the only reader of `process.env`.
- Shapes live in `lib/schemas.ts` (zod); do not hand-write duplicate interfaces.
- No em dashes in prose or copy. Use a plain dash.
- Never commit `.env.local` or any key.
- Long-running AI work goes through the task queue, never a single long HTTP request.

# Shopping fulfilment (agent procedure)

The app has no grocery API. "Shop for me" creates a `shopping_runs` row with status `requested` and a frozen `items` list. An agent with browser access fulfils it:

1. `GET /api/shopping` (signed in) or query `shopping_runs where status='requested'`; read `items` (skip lines whose status is `have_it`).
2. `POST /api/shopping/<id>/complete` with `Authorization: Bearer $WORKER_SECRET` and `{"status":"shopping"}` so the page shows progress.
3. In the person's own Chrome profile (they must already be signed in to Amazon; never enter credentials), open https://www.amazon.com/wholefoods, search each line, add the best match to the cart. Prefer Whole Foods 365 items, match the unit and quantity, and note substitutions.
4. Report with `{"status":"done","results":[{"ingredient_key":"...","unit":"...","status":"added|skipped|not_found","product":"...","note":"..."}],"notes":"..."}`. Use `failed` with `notes` if the run cannot be completed.
5. Never place the order. The person reviews the cart and checks out.
