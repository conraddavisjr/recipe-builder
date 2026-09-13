// Write the narrower srcset variants for every generated image that predates
// them (recipe photos, step stills, ingredient art). Idempotent: an image
// whose variants already exist is skipped. Widths mirror lib/imageSizes.ts.
// Usage: node scripts/backfill-image-sizes.mjs  (reads SUPABASE_* from .env.local; Node 22+)
import fs from "node:fs";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const WIDTHS = { photo: [480, 960], art: [96, 192] };
const QUALITY = { photo: 78, art: 82 };
const SETS = [
  { bucket: "recipe-images", prefix: "recipes", kind: "photo" },
  { bucket: "recipe-images", prefix: "steps", kind: "photo" },
  { bucket: "ingredient-art", prefix: "ingredients", kind: "art" },
];

async function listAll(bucket, prefix) {
  const out = [];
  const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) out.push(...(await listAll(bucket, path)));
    else out.push(path);
  }
  return out;
}

const isNative = (p) => /\.webp$/.test(p) && !/@\d+\.webp$/.test(p) && !/-poster\.webp$/.test(p);
const variant = (p, w) => p.replace(/\.webp$/, `@${w}.webp`);

let made = 0, skipped = 0, failed = 0;
for (const { bucket, prefix, kind } of SETS) {
  const all = await listAll(bucket, prefix);
  const have = new Set(all);
  for (const path of all.filter(isNative)) {
    const missing = WIDTHS[kind].filter((w) => !have.has(variant(path, w)));
    if (missing.length === 0) { skipped++; continue; }
    try {
      const { data, error } = await sb.storage.from(bucket).download(path);
      if (error) throw error;
      const bytes = Buffer.from(await data.arrayBuffer());
      for (const w of missing) {
        const out = await sharp(bytes).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY[kind] }).toBuffer();
        const { error: upErr } = await sb.storage.from(bucket).upload(variant(path, w), out, { contentType: "image/webp", upsert: true });
        if (upErr) throw upErr;
      }
      made++;
      if (made % 20 === 0) console.log(`${made} images done...`);
    } catch (err) {
      failed++;
      console.error(`failed ${bucket}/${path}: ${err.message ?? err}`);
    }
  }
}
console.log(`variants written for ${made} images, ${skipped} already had them, ${failed} failed`);
