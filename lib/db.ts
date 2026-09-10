import { getSupabase } from "@/lib/supabase/server";
import { LOCAL_USER_ID, config } from "@/lib/config";
import type {
  Instruction,
  InstructionTier,
  ProfileCategory,
  ProfileSelection,
  Settings,
} from "@/lib/types";

/**
 * The only module that talks to Supabase.
 *
 * Route handlers call these functions and never build queries themselves, so
 * every table access is greppable here and the row <-> domain mapping lives in
 * one place. Functions grow per feature chunk; sections are ordered to match
 * the schema file.
 */

const uid = LOCAL_USER_ID;

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

// ---------------------------------------------------------------------------
// Storage URLs
// ---------------------------------------------------------------------------

/** Public URL for an object in a public bucket. */
export function publicUrl(bucket: string, path: string | null): string | null {
  if (!path) return null;
  return getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Short-lived signed URL for an object in a private bucket. */
export async function signedUrl(bucket: string, path: string | null, seconds = 3600): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await getSupabase().storage.from(bucket).createSignedUrl(path, seconds);
  if (error) return null;
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Omit<Settings, "updated_at" | "last_run_at"> = {
  suggestion_count: 5,
  cadence: "daily",
  run_hour_utc: 12,
  autonomous_enabled: false,
  servings: 2,
  max_cook_minutes: 90,
  images_per_recipe: 2,
  ingredient_art_enabled: true,
};

export async function getSettings(): Promise<Settings> {
  const sb = getSupabase();
  const { data, error } = await sb.from("settings").select("*").eq("user_id", uid).maybeSingle();
  if (error) fail("getSettings", error);
  if (data) return stripUser(data) as Settings;
  // First visit: create the row so later updates are plain UPDATEs.
  const { data: created, error: insertError } = await sb
    .from("settings")
    .insert({ user_id: uid, ...DEFAULT_SETTINGS })
    .select("*")
    .single();
  if (insertError) fail("getSettings.insert", insertError);
  return stripUser(created) as Settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  await getSettings(); // ensure the row exists
  const { data, error } = await getSupabase()
    .from("settings")
    .update(patch)
    .eq("user_id", uid)
    .select("*")
    .single();
  if (error) fail("updateSettings", error);
  return stripUser(data) as Settings;
}

export async function markRunStarted(at: Date): Promise<void> {
  const { error } = await getSupabase()
    .from("settings")
    .update({ last_run_at: at.toISOString() })
    .eq("user_id", uid);
  if (error) fail("markRunStarted", error);
}

// ---------------------------------------------------------------------------
// Profile selections
// ---------------------------------------------------------------------------

export async function listProfileSelections(): Promise<ProfileSelection[]> {
  const { data, error } = await getSupabase()
    .from("profile_selections")
    .select("category, key, active, updated_at")
    .eq("user_id", uid);
  if (error) fail("listProfileSelections", error);
  return (data ?? []) as ProfileSelection[];
}

export async function setProfileSelection(
  category: ProfileCategory,
  key: string,
  active: boolean,
): Promise<ProfileSelection> {
  const { data, error } = await getSupabase()
    .from("profile_selections")
    .upsert({ user_id: uid, category, key, active }, { onConflict: "user_id,category,key" })
    .select("category, key, active, updated_at")
    .single();
  if (error) fail("setProfileSelection", error);
  return data as ProfileSelection;
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

const INSTRUCTION_COLS = "id, tier, body, recipe_id, active, created_at, updated_at";

export async function listInstructions(opts: { includeInactive?: boolean } = {}): Promise<Instruction[]> {
  let query = getSupabase()
    .from("instructions")
    .select(INSTRUCTION_COLS)
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (!opts.includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) fail("listInstructions", error);
  return (data ?? []) as Instruction[];
}

export async function createInstruction(input: {
  tier: InstructionTier;
  body: string;
  recipe_id?: string | null;
}): Promise<Instruction> {
  const { data, error } = await getSupabase()
    .from("instructions")
    .insert({ user_id: uid, tier: input.tier, body: input.body, recipe_id: input.recipe_id ?? null })
    .select(INSTRUCTION_COLS)
    .single();
  if (error) fail("createInstruction", error);
  return data as Instruction;
}

export async function updateInstruction(
  id: string,
  patch: Partial<Pick<Instruction, "body" | "tier" | "active">>,
): Promise<Instruction> {
  const { data, error } = await getSupabase()
    .from("instructions")
    .update(patch)
    .eq("user_id", uid)
    .eq("id", id)
    .select(INSTRUCTION_COLS)
    .single();
  if (error) fail("updateInstruction", error);
  return data as Instruction;
}

export async function deleteInstruction(id: string): Promise<void> {
  const { error } = await getSupabase().from("instructions").delete().eq("user_id", uid).eq("id", id);
  if (error) fail("deleteInstruction", error);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function stripUser<T extends { user_id?: string }>(row: T): Omit<T, "user_id"> {
  const { user_id: _ignored, ...rest } = row;
  void _ignored;
  return rest;
}

export const buckets = config.buckets;
