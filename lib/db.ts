import { getSupabase } from "@/lib/supabase/server";
import { LOCAL_USER_ID, config } from "@/lib/config";
import type {
  GeneratedRecipe,
  IngredientArt,
  Inspiration,
  Instruction,
  InstructionTier,
  ProfileCategory,
  ProfileSelection,
  Recipe,
  RecipeCard,
  RecipeImage,
  RecipeSource,
  Run,
  RunTrigger,
  Settings,
  SimilarityAxis,
  Task,
  TaskType,
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

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------


const RUN_COLS =
  "id, trigger, status, requested_count, prompt, similar_to_id, similarity_axes, inspiration_id, context_snapshot, error, started_at, finished_at, created_at";

export async function createRun(input: {
  trigger: RunTrigger;
  requested_count: number;
  prompt?: string | null;
  similar_to_id?: string | null;
  similarity_axes?: SimilarityAxis[] | null;
  inspiration_id?: string | null;
}): Promise<Run> {
  const { data, error } = await getSupabase()
    .from("runs")
    .insert({
      user_id: uid,
      trigger: input.trigger,
      requested_count: input.requested_count,
      prompt: input.prompt ?? null,
      similar_to_id: input.similar_to_id ?? null,
      similarity_axes: input.similarity_axes ?? null,
      inspiration_id: input.inspiration_id ?? null,
    })
    .select(RUN_COLS)
    .single();
  if (error) fail("createRun", error);
  return withProgress(data as Omit<Run, "progress">, { total: 0, done: 0, failed: 0 });
}

export async function updateRun(
  id: string,
  patch: Partial<Pick<Run, "status" | "context_snapshot" | "error" | "started_at" | "finished_at">>,
): Promise<void> {
  const { error } = await getSupabase().from("runs").update(patch).eq("id", id);
  if (error) fail("updateRun", error);
}

export async function getRun(id: string): Promise<Run | null> {
  const sb = getSupabase();
  const { data, error } = await sb.from("runs").select(RUN_COLS).eq("user_id", uid).eq("id", id).maybeSingle();
  if (error) fail("getRun", error);
  if (!data) return null;
  const progress = await runProgress(id);
  return withProgress(data as Omit<Run, "progress">, progress);
}

export async function listRuns(limit = 30): Promise<Run[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("runs")
    .select(RUN_COLS)
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("listRuns", error);
  const rows = (data ?? []) as Omit<Run, "progress">[];
  const { data: tasks, error: tErr } = await sb
    .from("tasks")
    .select("run_id, status")
    .in("run_id", rows.map((r) => r.id));
  if (tErr) fail("listRuns.tasks", tErr);
  const byRun = new Map<string, Run["progress"]>();
  for (const t of (tasks ?? []) as Array<{ run_id: string; status: Task["status"] }>) {
    const p = byRun.get(t.run_id) ?? { total: 0, done: 0, failed: 0 };
    p.total++;
    if (t.status === "done") p.done++;
    if (t.status === "failed") p.failed++;
    byRun.set(t.run_id, p);
  }
  return rows.map((r) => withProgress(r, byRun.get(r.id) ?? { total: 0, done: 0, failed: 0 }));
}

/** Runs that are still producing output; the grid polls while any exist. */
export async function listActiveRuns(): Promise<Run[]> {
  const all = await listRuns(10);
  return all.filter((r) => r.status === "queued" || r.status === "generating" || r.status === "rendering");
}

export async function listRenderingRunIds(): Promise<string[]> {
  const { data, error } = await getSupabase().from("runs").select("id").eq("user_id", uid).eq("status", "rendering");
  if (error) fail("listRenderingRunIds", error);
  return ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
}

async function runProgress(runId: string): Promise<Run["progress"]> {
  const { data, error } = await getSupabase().from("tasks").select("status").eq("run_id", runId);
  if (error) fail("runProgress", error);
  const rows = (data ?? []) as Array<{ status: Task["status"] }>;
  return {
    total: rows.length,
    done: rows.filter((t) => t.status === "done").length,
    failed: rows.filter((t) => t.status === "failed").length,
  };
}

function withProgress(run: Omit<Run, "progress">, progress: Run["progress"]): Run {
  return { ...run, progress };
}

// ---------------------------------------------------------------------------
// Tasks (queue)
// ---------------------------------------------------------------------------

export async function enqueueTask(type: TaskType, payload: Record<string, unknown>, runId: string | null = null): Promise<Task> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .insert({ type, payload, run_id: runId })
    .select("*")
    .single();
  if (error) fail("enqueueTask", error);
  return data as Task;
}

export async function enqueueTasks(rows: Array<{ type: TaskType; payload: Record<string, unknown>; runId?: string | null }>): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabase()
    .from("tasks")
    .insert(rows.map((r) => ({ type: r.type, payload: r.payload, run_id: r.runId ?? null })));
  if (error) fail("enqueueTasks", error);
}

/** Atomically claim up to `limit` queued tasks (see claim_tasks in the schema). */
export async function claimTasks(limit: number): Promise<Task[]> {
  const { data, error } = await getSupabase().rpc("claim_tasks", { p_limit: limit });
  if (error) fail("claimTasks", error);
  return (data ?? []) as Task[];
}

export async function completeTask(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("tasks")
    .update({ status: "done", finished_at: new Date().toISOString(), locked_at: null, error: null })
    .eq("id", id);
  if (error) fail("completeTask", error);
}

/** Requeue if attempts remain, otherwise mark failed with the error text. */
export async function failTask(task: Task, message: string): Promise<"requeued" | "failed"> {
  const exhausted = task.attempts >= task.max_attempts;
  const { error } = await getSupabase()
    .from("tasks")
    .update(
      exhausted
        ? { status: "failed", error: message, finished_at: new Date().toISOString(), locked_at: null }
        : { status: "queued", error: message, locked_at: null },
    )
    .eq("id", task.id);
  if (error) fail("failTask", error);
  return exhausted ? "failed" : "requeued";
}

export async function countQueuedTasks(): Promise<number> {
  const { count, error } = await getSupabase()
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");
  if (error) fail("countQueuedTasks", error);
  return count ?? 0;
}

/** True when every task for the run has finished (done or failed). */
export async function runTasksSettled(runId: string): Promise<{ settled: boolean; failed: number }> {
  const { data, error } = await getSupabase().from("tasks").select("status").eq("run_id", runId);
  if (error) fail("runTasksSettled", error);
  const rows = (data ?? []) as Array<{ status: Task["status"] }>;
  const open = rows.filter((t) => t.status === "queued" || t.status === "running").length;
  return { settled: open === 0, failed: rows.filter((t) => t.status === "failed").length };
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

const RECIPE_COLS =
  "id, run_id, title, summary_poetic, rationale, cuisine, dish_type, health_profile, presentation, tags, flavor_tags, servings, active_minutes, total_minutes, difficulty, ingredients, equipment, steps, image_prompts, source, similar_to_id, inspiration_id, status, favorite, rating, feedback, feedback_updated_at, created_at, updated_at";

/** Card columns: everything except the heavy step/equipment/prompt content. */
const CARD_COLS =
  "id, run_id, title, summary_poetic, rationale, cuisine, dish_type, health_profile, presentation, tags, flavor_tags, servings, active_minutes, total_minutes, difficulty, ingredients, source, similar_to_id, inspiration_id, status, favorite, rating, feedback, feedback_updated_at, created_at, updated_at";

const IMAGE_COLS = "id, recipe_id, kind, position, prompt, storage_path, status";

type RecipeRow = Omit<Recipe, "images">;
type ImageRow = Omit<RecipeImage, "url"> & { storage_path: string | null };

function toImage(row: ImageRow): RecipeImage {
  const { storage_path, ...rest } = row;
  return { ...rest, url: publicUrl(config.buckets.recipeImages, storage_path) };
}

export async function insertRecipes(
  generated: GeneratedRecipe[],
  meta: {
    run_id: string;
    source: RecipeSource;
    status: Recipe["status"];
    similar_to_id?: string | null;
    inspiration_id?: string | null;
  },
): Promise<RecipeRow[]> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .insert(
      generated.map((g) => ({
        user_id: uid,
        run_id: meta.run_id,
        source: meta.source,
        status: meta.status,
        similar_to_id: meta.similar_to_id ?? null,
        inspiration_id: meta.inspiration_id ?? null,
        ...g,
      })),
    )
    .select(RECIPE_COLS);
  if (error) fail("insertRecipes", error);
  return (data ?? []) as RecipeRow[];
}

export interface RecipeListFilters {
  q?: string;
  cuisine?: string;
  dish_type?: string;
  health_profile?: string;
  presentation?: string;
  source?: RecipeSource;
  favorites?: boolean;
  status?: Recipe["status"] | "any";
  run_id?: string;
  sort?: "newest" | "oldest" | "title" | "quickest";
  limit?: number;
}

export async function listRecipeCards(filters: RecipeListFilters = {}): Promise<RecipeCard[]> {
  const sb = getSupabase();
  let query = sb
    .from("recipes")
    .select(CARD_COLS)
    .eq("user_id", uid);
  if (filters.status !== "any") query = query.eq("status", filters.status ?? "saved");
  if (filters.cuisine) query = query.eq("cuisine", filters.cuisine);
  if (filters.dish_type) query = query.eq("dish_type", filters.dish_type);
  if (filters.health_profile) query = query.eq("health_profile", filters.health_profile);
  if (filters.presentation) query = query.eq("presentation", filters.presentation);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.favorites) query = query.eq("favorite", true);
  if (filters.run_id) query = query.eq("run_id", filters.run_id);
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_]/g, "")}%`;
    query = query.or(`title.ilike.${term},summary_poetic.ilike.${term},cuisine.ilike.${term},dish_type.ilike.${term}`);
  }
  switch (filters.sort) {
    case "oldest": query = query.order("created_at", { ascending: true }); break;
    case "title": query = query.order("title", { ascending: true }); break;
    case "quickest": query = query.order("total_minutes", { ascending: true }); break;
    default: query = query.order("created_at", { ascending: false });
  }
  query = query.limit(filters.limit ?? 200);
  const { data, error } = await query;
  if (error) fail("listRecipeCards", error);
  const rows = (data ?? []) as Array<Omit<RecipeCard, "images">>;
  const images = await imagesForRecipes(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, images: images.get(r.id) ?? [] }));
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .select(RECIPE_COLS)
    .eq("user_id", uid)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getRecipe", error);
  if (!data) return null;
  const images = await imagesForRecipes([id]);
  return { ...(data as RecipeRow), images: images.get(id) ?? [] };
}

/** Everything the similarity scorer needs, for the whole saved library. */
export async function listRecipesForSimilarity(): Promise<Array<Pick<RecipeCard, "id" | "cuisine" | "dish_type" | "presentation" | "health_profile" | "flavor_tags" | "tags" | "ingredients">>> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .select("id, cuisine, dish_type, presentation, health_profile, flavor_tags, tags, ingredients")
    .eq("user_id", uid)
    .eq("status", "saved");
  if (error) fail("listRecipesForSimilarity", error);
  return (data ?? []) as Array<Pick<RecipeCard, "id" | "cuisine" | "dish_type" | "presentation" | "health_profile" | "flavor_tags" | "tags" | "ingredients">>;
}

export async function getRecipeCardsByIds(ids: string[]): Promise<RecipeCard[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("recipes")
    .select(CARD_COLS)
    .eq("user_id", uid)
    .in("id", ids);
  if (error) fail("getRecipeCardsByIds", error);
  const rows = (data ?? []) as Array<Omit<RecipeCard, "images">>;
  const images = await imagesForRecipes(ids);
  const byId = new Map(rows.map((r) => [r.id, { ...r, images: images.get(r.id) ?? [] }]));
  return ids.map((id) => byId.get(id)).filter((r): r is RecipeCard => Boolean(r));
}

export async function updateRecipeFeedback(
  id: string,
  patch: { favorite?: boolean; rating?: number | null; feedback?: string | null },
): Promise<Recipe> {
  const update: Record<string, unknown> = { ...patch };
  if (patch.feedback !== undefined || patch.rating !== undefined) update.feedback_updated_at = new Date().toISOString();
  const { error } = await getSupabase().from("recipes").update(update).eq("user_id", uid).eq("id", id);
  if (error) fail("updateRecipeFeedback", error);
  const recipe = await getRecipe(id);
  if (!recipe) throw new Error("updateRecipeFeedback: recipe vanished");
  return recipe;
}

export async function setRecipeStatus(ids: string[], status: Recipe["status"]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await getSupabase().from("recipes").update({ status }).eq("user_id", uid).in("id", ids);
  if (error) fail("setRecipeStatus", error);
}

export async function deleteRecipes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const sb = getSupabase();
  const { data: images } = await sb.from("recipe_images").select("storage_path").in("recipe_id", ids);
  const paths = ((images ?? []) as Array<{ storage_path: string | null }>).map((i) => i.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await sb.storage.from(config.buckets.recipeImages).remove(paths);
  const { error } = await sb.from("recipes").delete().eq("user_id", uid).in("id", ids);
  if (error) fail("deleteRecipes", error);
}

/** Feedback history the model should learn from: anything rated, favorited, or commented. */
export async function listRecipeFeedback(limit = 60): Promise<Array<Pick<Recipe, "id" | "title" | "cuisine" | "dish_type" | "favorite" | "rating" | "feedback" | "flavor_tags" | "created_at">>> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .select("id, title, cuisine, dish_type, favorite, rating, feedback, flavor_tags, created_at")
    .eq("user_id", uid)
    .eq("status", "saved")
    .or("favorite.eq.true,rating.not.is.null,feedback.not.is.null")
    .order("feedback_updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) fail("listRecipeFeedback", error);
  return (data ?? []) as Array<Pick<Recipe, "id" | "title" | "cuisine" | "dish_type" | "favorite" | "rating" | "feedback" | "flavor_tags" | "created_at">>;
}

export async function listRecentRecipeTitles(limit = 40): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .select("title")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("listRecentRecipeTitles", error);
  return ((data ?? []) as Array<{ title: string }>).map((r) => r.title);
}

// ---------------------------------------------------------------------------
// Recipe images
// ---------------------------------------------------------------------------

async function imagesForRecipes(ids: string[]): Promise<Map<string, RecipeImage[]>> {
  const map = new Map<string, RecipeImage[]>();
  if (ids.length === 0) return map;
  const { data, error } = await getSupabase()
    .from("recipe_images")
    .select(IMAGE_COLS)
    .in("recipe_id", ids)
    .order("position", { ascending: true });
  if (error) fail("imagesForRecipes", error);
  for (const row of (data ?? []) as ImageRow[]) {
    const list = map.get(row.recipe_id) ?? [];
    list.push(toImage(row));
    map.set(row.recipe_id, list);
  }
  return map;
}

export async function insertRecipeImages(
  rows: Array<{ recipe_id: string; kind: RecipeImage["kind"]; position: number; prompt: string }>,
): Promise<RecipeImage[]> {
  if (rows.length === 0) return [];
  const { data, error } = await getSupabase().from("recipe_images").insert(rows).select(IMAGE_COLS);
  if (error) fail("insertRecipeImages", error);
  return ((data ?? []) as ImageRow[]).map(toImage);
}

export async function markRecipeImage(id: string, patch: { storage_path?: string; status: RecipeImage["status"]; error?: string | null }): Promise<void> {
  const { error } = await getSupabase().from("recipe_images").update(patch).eq("id", id);
  if (error) fail("markRecipeImage", error);
}

// ---------------------------------------------------------------------------
// Ingredient art (shared cache)
// ---------------------------------------------------------------------------

type ArtRow = { ingredient_key: string; display_name: string; storage_path: string | null; status: IngredientArt["status"] };

function toArt(row: ArtRow): IngredientArt {
  return {
    ingredient_key: row.ingredient_key,
    display_name: row.display_name,
    status: row.status,
    url: publicUrl(config.buckets.ingredientArt, row.storage_path),
  };
}

export async function getIngredientArt(keys: string[]): Promise<Map<string, IngredientArt>> {
  const map = new Map<string, IngredientArt>();
  if (keys.length === 0) return map;
  const { data, error } = await getSupabase()
    .from("ingredient_art")
    .select("ingredient_key, display_name, storage_path, status")
    .in("ingredient_key", keys);
  if (error) fail("getIngredientArt", error);
  for (const row of (data ?? []) as ArtRow[]) map.set(row.ingredient_key, toArt(row));
  return map;
}

/**
 * Register ingredients that have no art yet. Returns the keys that were newly
 * registered (and therefore need a render task). Existing rows, done or
 * pending, are left alone, so concurrent runs never double-render.
 */
export async function registerIngredientArt(items: Array<{ ingredient_key: string; display_name: string; prompt: string }>): Promise<string[]> {
  if (items.length === 0) return [];
  const sb = getSupabase();
  const unique = new Map(items.map((i) => [i.ingredient_key, i]));
  const { data: existing, error } = await sb
    .from("ingredient_art")
    .select("ingredient_key")
    .in("ingredient_key", [...unique.keys()]);
  if (error) fail("registerIngredientArt.existing", error);
  const have = new Set(((existing ?? []) as Array<{ ingredient_key: string }>).map((r) => r.ingredient_key));
  const fresh = [...unique.values()].filter((i) => !have.has(i.ingredient_key));
  if (fresh.length === 0) return [];
  const { error: insErr } = await sb
    .from("ingredient_art")
    .upsert(fresh.map((i) => ({ ...i, status: "pending" })), { onConflict: "ingredient_key", ignoreDuplicates: true });
  if (insErr) fail("registerIngredientArt.insert", insErr);
  return fresh.map((i) => i.ingredient_key);
}

export async function markIngredientArt(key: string, patch: { storage_path?: string; status: IngredientArt["status"]; error?: string | null }): Promise<void> {
  const { error } = await getSupabase().from("ingredient_art").update(patch).eq("ingredient_key", key);
  if (error) fail("markIngredientArt", error);
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function uploadBytes(bucket: string, path: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const { error } = await getSupabase().storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
  if (error) fail(`uploadBytes ${bucket}/${path}`, error);
  return path;
}

// ---------------------------------------------------------------------------
// Inspirations (read side; write side lands with the inspirations feature)
// ---------------------------------------------------------------------------

const INSPIRATION_COLS =
  "id, dish_name, restaurant_name, city, notes, photo_path, analysis, user_ingredients, analysis_status, analysis_error, analyzed_at, created_at, updated_at";

type InspirationRow = Omit<Inspiration, "photo_url">;

async function withPhotoUrl(row: InspirationRow): Promise<Inspiration> {
  return { ...row, photo_url: await signedUrl(config.buckets.inspirationPhotos, row.photo_path) };
}

export async function listInspirations(): Promise<Inspiration[]> {
  const { data, error } = await getSupabase()
    .from("inspirations")
    .select(INSPIRATION_COLS)
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) fail("listInspirations", error);
  return Promise.all(((data ?? []) as InspirationRow[]).map(withPhotoUrl));
}

export async function getInspiration(id: string): Promise<Inspiration | null> {
  const { data, error } = await getSupabase()
    .from("inspirations")
    .select(INSPIRATION_COLS)
    .eq("user_id", uid)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getInspiration", error);
  return data ? withPhotoUrl(data as InspirationRow) : null;
}

// ---------------------------------------------------------------------------
// Inspirations (write side)
// ---------------------------------------------------------------------------

export async function createInspiration(input: {
  dish_name: string;
  restaurant_name: string;
  city: string;
  notes: string;
  photo_path?: string | null;
}): Promise<Inspiration> {
  const { data, error } = await getSupabase()
    .from("inspirations")
    .insert({ user_id: uid, ...input, photo_path: input.photo_path ?? null })
    .select(INSPIRATION_COLS)
    .single();
  if (error) fail("createInspiration", error);
  return withPhotoUrl(data as InspirationRow);
}

/**
 * Update the user-editable fields. Existing analysis is never cleared: if the
 * facts it was based on change, it is marked stale until re-analysis.
 */
export async function updateInspiration(
  id: string,
  patch: Partial<Pick<Inspiration, "dish_name" | "restaurant_name" | "city" | "notes" | "photo_path" | "user_ingredients">>,
): Promise<Inspiration> {
  const current = await getInspiration(id);
  if (!current) throw new Error("updateInspiration: not found");
  const update: Record<string, unknown> = { ...patch };
  if (current.analysis && current.analysis_status === "done") update.analysis_status = "stale";
  const { data, error } = await getSupabase()
    .from("inspirations")
    .update(update)
    .eq("user_id", uid)
    .eq("id", id)
    .select(INSPIRATION_COLS)
    .single();
  if (error) fail("updateInspiration", error);
  return withPhotoUrl(data as InspirationRow);
}

export async function setInspirationAnalysis(
  id: string,
  patch: { analysis?: Inspiration["analysis"]; analysis_status: Inspiration["analysis_status"]; analysis_error?: string | null },
): Promise<void> {
  const update: Record<string, unknown> = { ...patch };
  if (patch.analysis_status === "done") update.analyzed_at = new Date().toISOString();
  const { error } = await getSupabase().from("inspirations").update(update).eq("id", id);
  if (error) fail("setInspirationAnalysis", error);
}

export async function deleteInspiration(id: string): Promise<void> {
  const sb = getSupabase();
  const current = await getInspiration(id);
  if (current?.photo_path) await sb.storage.from(config.buckets.inspirationPhotos).remove([current.photo_path]);
  const { error } = await sb.from("inspirations").delete().eq("user_id", uid).eq("id", id);
  if (error) fail("deleteInspiration", error);
}

/** Signed URL the browser can PUT a photo to directly, bypassing the app server. */
export async function createPhotoUploadUrl(path: string): Promise<{ url: string; token: string; path: string }> {
  const { data, error } = await getSupabase().storage.from(config.buckets.inspirationPhotos).createSignedUploadUrl(path);
  if (error) fail("createPhotoUploadUrl", error);
  return { url: data.signedUrl, token: data.token, path: data.path };
}

/** Raw bytes of a stored photo, for sending to the vision model. */
export async function downloadPhoto(path: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const { data, error } = await getSupabase().storage.from(config.buckets.inspirationPhotos).download(path);
  if (error) fail("downloadPhoto", error);
  return { bytes: new Uint8Array(await data.arrayBuffer()), contentType: data.type || "image/jpeg" };
}

// ---------------------------------------------------------------------------
// Groups (collections of recipes with a consolidated shopping list)
// ---------------------------------------------------------------------------

export interface GroupRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  recipe_count: number;
  /** Up to four hero image URLs for the collage. */
  covers: string[];
}

const GROUP_COLS = "id, name, description, created_at, updated_at";

export async function listGroups(): Promise<GroupRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb.from("groups").select(GROUP_COLS).eq("user_id", uid).order("created_at", { ascending: false });
  if (error) fail("listGroups", error);
  const groups = (data ?? []) as Array<Omit<GroupRow, "recipe_count" | "covers">>;
  if (groups.length === 0) return [];
  const { data: members, error: mErr } = await sb
    .from("group_recipes")
    .select("group_id, recipe_id, added_at")
    .in("group_id", groups.map((g) => g.id))
    .order("added_at", { ascending: false });
  if (mErr) fail("listGroups.members", mErr);
  const rows = (members ?? []) as Array<{ group_id: string; recipe_id: string }>;
  const cards = await getRecipeCardsByIds([...new Set(rows.map((r) => r.recipe_id))]);
  const heroByRecipe = new Map(cards.map((c) => [c.id, c.images.find((i) => i.status === "done" && i.url)?.url ?? null]));
  return groups.map((g) => {
    const mine = rows.filter((r) => r.group_id === g.id);
    return {
      ...g,
      recipe_count: mine.length,
      covers: mine.map((r) => heroByRecipe.get(r.recipe_id)).filter((u): u is string => Boolean(u)).slice(0, 4),
    };
  });
}

export async function createGroup(input: { name: string; description?: string }): Promise<GroupRow> {
  const { data, error } = await getSupabase()
    .from("groups")
    .insert({ user_id: uid, name: input.name, description: input.description ?? "" })
    .select(GROUP_COLS)
    .single();
  if (error) fail("createGroup", error);
  return { ...(data as Omit<GroupRow, "recipe_count" | "covers">), recipe_count: 0, covers: [] };
}

export async function updateGroup(id: string, patch: { name?: string; description?: string }): Promise<void> {
  const { error } = await getSupabase().from("groups").update(patch).eq("user_id", uid).eq("id", id);
  if (error) fail("updateGroup", error);
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await getSupabase().from("groups").delete().eq("user_id", uid).eq("id", id);
  if (error) fail("deleteGroup", error);
}

/** A group with its member recipes (full content, for the shopping list). */
export async function getGroup(id: string): Promise<{ group: GroupRow; recipes: Recipe[] } | null> {
  const sb = getSupabase();
  const { data, error } = await sb.from("groups").select(GROUP_COLS).eq("user_id", uid).eq("id", id).maybeSingle();
  if (error) fail("getGroup", error);
  if (!data) return null;
  const { data: members, error: mErr } = await sb
    .from("group_recipes")
    .select("recipe_id, added_at")
    .eq("group_id", id)
    .order("added_at", { ascending: false });
  if (mErr) fail("getGroup.members", mErr);
  const ids = ((members ?? []) as Array<{ recipe_id: string }>).map((m) => m.recipe_id);
  const recipes = (await Promise.all(ids.map((rid) => getRecipe(rid)))).filter((r): r is Recipe => Boolean(r));
  const covers = recipes.map((r) => r.images.find((i) => i.status === "done" && i.url)?.url).filter((u): u is string => Boolean(u)).slice(0, 4);
  return { group: { ...(data as Omit<GroupRow, "recipe_count" | "covers">), recipe_count: recipes.length, covers }, recipes };
}

export async function addRecipeToGroup(groupId: string, recipeId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("group_recipes")
    .upsert({ group_id: groupId, recipe_id: recipeId }, { onConflict: "group_id,recipe_id", ignoreDuplicates: true });
  if (error) fail("addRecipeToGroup", error);
}

export async function removeRecipeFromGroup(groupId: string, recipeId: string): Promise<void> {
  const { error } = await getSupabase().from("group_recipes").delete().eq("group_id", groupId).eq("recipe_id", recipeId);
  if (error) fail("removeRecipeFromGroup", error);
}

/** Group ids a recipe belongs to, for the add-to-group popover. */
export async function groupIdsForRecipe(recipeId: string): Promise<string[]> {
  const { data, error } = await getSupabase().from("group_recipes").select("group_id").eq("recipe_id", recipeId);
  if (error) fail("groupIdsForRecipe", error);
  return ((data ?? []) as Array<{ group_id: string }>).map((r) => r.group_id);
}

/** Number of generator drafts waiting to be kept or discarded. */
export async function countCandidates(): Promise<number> {
  const { count, error } = await getSupabase()
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("status", "candidate");
  if (error) fail("countCandidates", error);
  return count ?? 0;
}
