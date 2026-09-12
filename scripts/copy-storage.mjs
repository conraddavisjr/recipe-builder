// Copy every object in the local Supabase Storage buckets to a hosted
// project, keeping the same paths so recipe_images.storage_path,
// ingredient_art.storage_path and inspirations.photo_path stay valid.
// Usage: node scripts/copy-storage.mjs  (reads .env.local: SUPABASE_* = local stack, REMOTE_SUPABASE_* = hosted project)
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const local = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const remote = createClient(process.env.REMOTE_SUPABASE_URL, process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function listAll(client, bucket, prefix = "") {
  const out = [];
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) out.push(...(await listAll(client, bucket, path))); // folder
    else out.push(path);
  }
  return out;
}

let copied = 0, skipped = 0, failed = 0;
for (const bucket of ["recipe-images", "ingredient-art", "inspiration-photos"]) {
  const paths = await listAll(local, bucket);
  const existing = new Set(await listAll(remote, bucket).catch(() => []));
  for (const path of paths) {
    if (existing.has(path)) { skipped++; continue; }
    const { data, error } = await local.storage.from(bucket).download(path);
    if (error) { failed++; console.error("download failed", bucket, path, error.message); continue; }
    const bytes = new Uint8Array(await data.arrayBuffer());
    const { error: upErr } = await remote.storage.from(bucket).upload(path, bytes, { contentType: data.type || "image/webp", upsert: true });
    if (upErr) { failed++; console.error("upload failed", bucket, path, upErr.message); continue; }
    copied++;
  }
  console.log(`${bucket}: ${paths.length} objects (copied ${copied}, skipped ${skipped}, failed ${failed} so far)`);
}
console.log({ copied, skipped, failed });
