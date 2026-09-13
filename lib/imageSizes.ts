/**
 * Responsive image sizes. Every generated picture is stored at its native
 * size plus a few narrower variants, and the browser picks the one that
 * fits the slot it is rendering into (srcset + sizes). Pure module: shared
 * by the worker (which writes the variants) and the client (which asks for
 * them), so it must never import sharp or Supabase.
 *
 * Variant naming: `recipes/<id>/<img>.webp` -> `recipes/<id>/<img>@480.webp`.
 */

export type ImageKind = "photo" | "art";

/** Native width of each kind, as produced by lib/ai/images.ts. */
export const NATIVE_WIDTH: Record<ImageKind, number> = { photo: 1536, art: 1024 };

/** Narrower variants written next to the native file, ascending. */
export const VARIANT_WIDTHS: Record<ImageKind, number[]> = {
  photo: [480, 960],
  art: [96, 192],
};

/** Path or URL of one variant. Leaves the input untouched when it has no extension. */
export function variantPath(pathOrUrl: string, width: number): string {
  const m = pathOrUrl.match(/^(.*)\.([a-z0-9]+)$/i);
  return m ? `${m[1]}@${width}.${m[2]}` : pathOrUrl;
}

/** Every storage path a native image owns, including itself. */
export function imagePathsFor(path: string, kind: ImageKind): string[] {
  return [path, ...VARIANT_WIDTHS[kind].map((w) => variantPath(path, w))];
}

/** srcset for an <img>: the variants plus the native file at its width. */
export function srcSetFor(url: string, kind: ImageKind): string {
  return [...VARIANT_WIDTHS[kind].map((w) => `${variantPath(url, w)} ${w}w`), `${url} ${NATIVE_WIDTH[kind]}w`].join(", ");
}

/**
 * `sizes` presets for the slots the app renders into. Each describes the
 * rendered width so the browser can pick the smallest sufficient variant.
 */
export const SIZES = {
  /** Library grid: one column on phones, two to three on wider screens. */
  card: "(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw",
  /** Detail hero: full content column, two thirds on wide screens. */
  hero: "(max-width: 1024px) calc(100vw - 32px), 66vw",
  /** Step figure: capped at 34rem. */
  step: "(max-width: 640px) calc(100vw - 32px), 544px",
  /** Small list thumbnails and gallery buttons. */
  thumb: "96px",
  /** Ingredient art tile. */
  art: "44px",
} as const;
