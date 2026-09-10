# Palate

A bespoke recipe recommender that learns your palate.
Desktop-first, responsive, built with Next.js 16, Supabase, Claude (reasoning, research, vision) and OpenAI image models (food photography, ingredient illustrations).

Runs autonomously in the cloud: a scheduled job reads your latest settings, profile, instructions, inspirations and feedback, then cooks up a fresh set of recipes without being asked.

## Run locally

Requires Node 20.9+ (`.nvmrc` pins 20.20.2).

```sh
npm ci
cp .env.example .env.local   # fill in Supabase, Anthropic, OpenAI
npm run dev
```

Apply `supabase/schema.sql` once in the Supabase SQL editor (it is idempotent).
It creates every table, the task-queue claim function and the three storage buckets.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Tests cover pure logic only (context building, similarity, schemas, scheduling).
UI behavior is verified in the browser.

## Architecture

```
browser ("use client" components)
   |  fetch("/api/...")
   v
app/api/*/route.ts        thin handlers: validate with zod, call lib/db, return JSON
   |
   v
lib/db.ts                 the ONLY module that touches Supabase (Postgres + Storage)
lib/ai/*                  Claude calls (generation, review, research, re-analysis) and OpenAI images
lib/jobs/*                Postgres task queue drained by POST /api/worker in bounded slices
```

- `lib/config.ts` is the only reader of `process.env`.
- `lib/schemas.ts` defines every shape that crosses a boundary; `lib/types.ts` infers types from it.
- `lib/catalog/` is the preference vocabulary shown by the wizard and sent to the model.
- `lib/icons.ts` is the iconography taxonomy: every recipe step segment (ingredient, equipment, temperature, time, technique, tip) gets a consistent glyph and color.
- `proxy.ts` is a single-owner password gate (`APP_PASSWORD`); machine endpoints use bearer secrets instead.

### Background work

Recipe generation with imagery takes minutes, longer than one serverless invocation.
Work is split into small tasks in the `tasks` table, claimed with `FOR UPDATE SKIP LOCKED` by `POST /api/worker`.
Each invocation drains for a bounded slice and re-triggers itself while work remains.
A Supabase `pg_cron` heartbeat calls the worker every minute as a safety net.
`GET /api/cron/recommend` (Vercel Cron) decides whether an autonomous run is due from the latest settings and enqueues it.

## Status

See `docs/STATUS.md` for what is built, what is verified, and what is next.
