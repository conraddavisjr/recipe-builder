#!/usr/bin/env bash
# Dump the local Supabase Postgres database (recipes, profile, groups, runs)
# to backups/<timestamp>.sql. Storage objects (photos, illustrations) live in
# the docker volume supabase_storage_<project_id>; back that up with
# `docker run --rm -v supabase_storage_temp-recipie-gen:/data -v "$PWD/backups":/out alpine tar czf /out/storage.tgz /data`.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
DB=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
[ -n "$DB" ] || { echo "local Supabase is not running (npx supabase start)"; exit 1; }
OUT="backups/palate-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB" pg_dump -U postgres -d postgres --schema=public --schema=storage --no-owner --no-privileges > "$OUT"
echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
