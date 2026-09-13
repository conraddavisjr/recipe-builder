import sharp from "sharp";
import { VARIANT_WIDTHS, type ImageKind } from "@/lib/imageSizes";

/**
 * Narrower webp variants of a generated image, for srcset. Runs in the
 * worker right after generation, and in the backfill script for images
 * that predate variants.
 */
export interface ImageVariant {
  width: number;
  bytes: Uint8Array;
}

export async function makeVariants(bytes: Uint8Array, kind: ImageKind): Promise<ImageVariant[]> {
  const out: ImageVariant[] = [];
  for (const width of VARIANT_WIDTHS[kind]) {
    const resized = await sharp(bytes).resize({ width, withoutEnlargement: true }).webp({ quality: kind === "art" ? 82 : 78 }).toBuffer();
    out.push({ width, bytes: new Uint8Array(resized) });
  }
  return out;
}
