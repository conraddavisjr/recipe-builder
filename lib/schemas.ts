import { z } from "zod";

/**
 * Zod schemas are the single definition of every shape that crosses a
 * boundary: model output, route handler input, and jsonb columns. Types in
 * lib/types.ts are inferred from these, never hand-written twice.
 */

// ---------------------------------------------------------------------------
// Recipe content (jsonb columns on recipes)
// ---------------------------------------------------------------------------

/**
 * Every piece of a step is tagged so the UI can put an icon on it. "text" is
 * plain connective prose; everything else gets a glyph from lib/icons.ts.
 */
export const SegmentKind = z.enum([
  "text",
  "ingredient",
  "equipment",
  "temperature",
  "time",
  "technique",
  "tip",
]);

export const StepSegmentSchema = z.object({
  kind: SegmentKind,
  text: z.string().min(1),
  /** Machine-readable value where it helps: "200C", "12 min", "sear". */
  value: z.string().optional(),
});

export const StepSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
  segments: z.array(StepSegmentSchema).min(1),
  duration_minutes: z.number().min(0).optional(),
  temperature: z.string().optional(),
});

export const IngredientSchema = z.object({
  /** Normalized snake_case key used to cache illustrations: "garlic", "cherry_tomato". */
  ingredient_key: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().nullable(),
  unit: z.string(),
  preparation: z.string(),
  optional: z.boolean(),
});

export const EquipmentSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  essential: z.boolean(),
});

export const Difficulty = z.enum(["easy", "medium", "hard"]);

/** One generated recipe, exactly as the model must return it. */
export const GeneratedRecipeSchema = z.object({
  title: z.string().min(1),
  summary_poetic: z.string().min(1),
  rationale: z.string().min(1),
  cuisine: z.string().min(1),
  dish_type: z.string().min(1),
  health_profile: z.string().min(1),
  presentation: z.string().min(1),
  tags: z.array(z.string()),
  flavor_tags: z.array(z.string()),
  servings: z.number().int().min(1),
  active_minutes: z.number().int().min(0),
  total_minutes: z.number().int().min(0),
  difficulty: Difficulty,
  ingredients: z.array(IngredientSchema).min(1),
  equipment: z.array(EquipmentSchema),
  steps: z.array(StepSchema).min(1),
  /** One photography prompt per requested image, each a distinct view. */
  image_prompts: z.array(z.string().min(1)).min(1),
});

export const GeneratedBatchSchema = z.object({
  recipes: z.array(GeneratedRecipeSchema).min(1),
});

// ---------------------------------------------------------------------------
// Inspiration analysis (jsonb on inspirations)
// ---------------------------------------------------------------------------

export const Provenance = z.enum(["verified", "inferred", "user_provided"]);

export const AnalyzedIngredientSchema = z.object({
  ingredient_key: z.string().min(1),
  name: z.string().min(1),
  role: z.string(),
  provenance: Provenance,
  confidence: z.number().min(0).max(1),
  note: z.string(),
});

export const InspirationAnalysisSchema = z.object({
  restaurant_verified: z.boolean(),
  dish_verified: z.boolean(),
  restaurant_summary: z.string(),
  menu_description: z.string(),
  cuisine: z.string(),
  flavor_notes: z.array(z.string()),
  techniques: z.array(z.string()),
  ingredients: z.array(AnalyzedIngredientSchema),
  photo_observations: z.string(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
  caveats: z.string(),
});

/** A user correction row: what the user says is actually in the dish. */
export const UserIngredientSchema = z.object({
  name: z.string().min(1),
  note: z.string(),
});

// ---------------------------------------------------------------------------
// API inputs
// ---------------------------------------------------------------------------

export const ProfileCategory = z.enum([
  "cuisine_love",
  "cuisine_avoid",
  "flavor",
  "presentation",
  "health",
  "diet_absolute",
  "cookware",
]);

export const ProfileToggleInput = z.object({
  category: ProfileCategory,
  key: z.string().min(1).max(80),
  active: z.boolean(),
});

export const SettingsInput = z.object({
  suggestion_count: z.number().int().min(1).max(12).optional(),
  cadence: z.enum(["daily", "weekly"]).optional(),
  run_hour_utc: z.number().int().min(0).max(23).optional(),
  autonomous_enabled: z.boolean().optional(),
  servings: z.number().int().min(1).max(12).optional(),
  max_cook_minutes: z.number().int().min(10).max(600).optional(),
  images_per_recipe: z.number().int().min(1).max(3).optional(),
  ingredient_art_enabled: z.boolean().optional(),
});

export const InstructionTier = z.enum(["truth", "preference"]);

export const InstructionInput = z.object({
  tier: InstructionTier,
  body: z.string().trim().min(1).max(4000),
  recipe_id: z.string().uuid().nullable().optional(),
});

export const InstructionPatch = z.object({
  body: z.string().trim().min(1).max(4000).optional(),
  tier: InstructionTier.optional(),
  active: z.boolean().optional(),
});

export const InspirationInput = z.object({
  dish_name: z.string().trim().min(1).max(200),
  restaurant_name: z.string().trim().max(200).default(""),
  city: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(4000).default(""),
  photo_path: z.string().max(400).nullable().optional(),
});

export const InspirationIngredientsPatch = z.object({
  user_ingredients: z.array(UserIngredientSchema).max(80),
});

export const RecipeFeedbackInput = z.object({
  favorite: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  feedback: z.string().trim().max(4000).nullable().optional(),
});

export const SimilarityAxis = z.enum([
  "ingredients",
  "taste",
  "presentation",
  "cuisine",
  "dish_type",
]);

export const SimilarRunInput = z.object({
  axes: z.array(SimilarityAxis).min(1),
  count: z.number().int().min(1).max(8).optional(),
});

export const GeneratorRunInput = z.object({
  prompt: z.string().trim().min(3).max(2000),
  count: z.number().int().min(1).max(8).optional(),
});

export const KeepCandidatesInput = z.object({
  run_id: z.string().uuid(),
  keep_ids: z.array(z.string().uuid()),
});
