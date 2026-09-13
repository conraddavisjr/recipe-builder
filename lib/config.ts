/**
 * Single source of every environment-driven value.
 *
 * Nothing else in the codebase reads process.env. Keeping it here means a
 * missing variable fails in one predictable place with a readable message,
 * and the .env.example stays the complete list of knobs.
 */

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

/** The app name is a single constant so a rename is a one-line change. */
export const APP_NAME = "Palate";

/**
 * Single personal workspace. Every table carries user_id so real auth later is
 * a data migration, not a schema rewrite.
 */
export const LOCAL_USER_ID = "conrad";

export const config = {
  /** Public values used by the browser to start Google sign-in. */
  supabasePublicUrl: optional("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  /** Emails allowed through the sign-in gate; empty disables the gate (local dev only). */
  allowedEmails: optional("ALLOWED_EMAILS")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  supabaseUrl: optional("SUPABASE_URL"),
  supabaseServiceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),

  anthropicModel: optional("ANTHROPIC_MODEL", "claude-opus-5"),
  openaiImageModel: optional("OPENAI_IMAGE_MODEL", "gpt-image-2.5-flare"),
  openaiVideoModel: optional("OPENAI_VIDEO_MODEL", "sora-2"),
  openaiApiKey: optional("OPENAI_API_KEY"),

  cronSecret: optional("CRON_SECRET"),
  workerSecret: optional("WORKER_SECRET"),

  /** Origin used for the worker's self re-trigger. Vercel exposes VERCEL_URL without a scheme. */
  appOrigin:
    optional("APP_ORIGIN") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  /** Storage bucket names. Created by supabase/schema.sql. */
  buckets: {
    recipeImages: "recipe-images",
    ingredientArt: "ingredient-art",
    inspirationPhotos: "inspiration-photos",
  },

  /** How long one worker invocation may keep draining before it hands off to a fresh one. */
  workerSliceMs: 240_000,
} as const;

/** True when the app runs without the sign-in gate (local dev with no allowlist). */
export const isGateDisabled = config.allowedEmails.length === 0;
