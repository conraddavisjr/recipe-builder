import type { z } from "zod";
import type {
  AnalyzedIngredientSchema,
  EquipmentSchema,
  GeneratedRecipeSchema,
  IngredientSchema,
  InspirationAnalysisSchema,
  InstructionTier,
  ProfileCategory,
  SegmentKind,
  SimilarityAxis,
  StepSchema,
  StepSegmentSchema,
  UserIngredientSchema,
} from "@/lib/schemas";

/** Canonical domain types used by the UI and route handlers (camelCase-free by
 * choice: the jsonb content keeps the model's snake_case so it round-trips
 * without a mapping layer). */

export type SegmentKind = z.infer<typeof SegmentKind>;
export type StepSegment = z.infer<typeof StepSegmentSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type GeneratedRecipe = z.infer<typeof GeneratedRecipeSchema>;
export type InspirationAnalysis = z.infer<typeof InspirationAnalysisSchema>;
export type AnalyzedIngredient = z.infer<typeof AnalyzedIngredientSchema>;
export type UserIngredient = z.infer<typeof UserIngredientSchema>;
export type ProfileCategory = z.infer<typeof ProfileCategory>;
export type InstructionTier = z.infer<typeof InstructionTier>;
export type SimilarityAxis = z.infer<typeof SimilarityAxis>;

export type RecipeSource = "autonomous" | "generator" | "similar" | "inspiration";
export type RecipeStatus = "candidate" | "saved";
export type RunTrigger = "scheduled" | "manual" | "generator" | "similar" | "inspiration";
export type RunStatus = "queued" | "generating" | "rendering" | "done" | "failed";
export type AnalysisStatus = "pending" | "running" | "done" | "stale" | "failed";
export type ImageStatus = "pending" | "done" | "failed";

export interface Settings {
  suggestion_count: number;
  cadence: "daily" | "weekly";
  run_hour_utc: number;
  autonomous_enabled: boolean;
  servings: number;
  max_cook_minutes: number;
  images_per_recipe: number;
  ingredient_art_enabled: boolean;
  last_run_at: string | null;
  updated_at: string;
}

export interface ProfileSelection {
  category: ProfileCategory;
  key: string;
  active: boolean;
  updated_at: string;
}

export interface Instruction {
  id: string;
  tier: InstructionTier;
  body: string;
  recipe_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeImage {
  id: string;
  recipe_id: string;
  kind: "hero" | "angle" | "plated";
  position: number;
  prompt: string;
  /** Public URL, resolved in lib/db.ts from storage_path. Null while pending. */
  url: string | null;
  status: ImageStatus;
}

export interface IngredientArt {
  ingredient_key: string;
  display_name: string;
  url: string | null;
  status: ImageStatus;
}

export interface Recipe extends GeneratedRecipe {
  id: string;
  run_id: string | null;
  source: RecipeSource;
  similar_to_id: string | null;
  inspiration_id: string | null;
  status: RecipeStatus;
  favorite: boolean;
  rating: number | null;
  feedback: string | null;
  feedback_updated_at: string | null;
  created_at: string;
  updated_at: string;
  images: RecipeImage[];
}

/** Grid card payload: the recipe minus its heavy step content. */
export type RecipeCard = Omit<Recipe, "steps" | "equipment" | "image_prompts">;

export interface Inspiration {
  id: string;
  dish_name: string;
  restaurant_name: string;
  city: string;
  notes: string;
  photo_path: string | null;
  /** Signed URL, resolved in lib/db.ts. */
  photo_url: string | null;
  analysis: InspirationAnalysis | null;
  user_ingredients: UserIngredient[];
  analysis_status: AnalysisStatus;
  analysis_error: string | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Run {
  id: string;
  trigger: RunTrigger;
  status: RunStatus;
  requested_count: number;
  prompt: string | null;
  similar_to_id: string | null;
  similarity_axes: SimilarityAxis[] | null;
  inspiration_id: string | null;
  context_snapshot: unknown;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  /** Live progress derived from tasks, for the UI. */
  progress: { total: number; done: number; failed: number };
}

export type TaskType =
  | "generate_recipes"
  | "render_recipe_image"
  | "render_ingredient_art"
  | "analyze_inspiration"
  | "reanalyze_ingredients"
  | "cleanup_candidates";

export interface Task {
  id: string;
  run_id: string | null;
  type: TaskType;
  payload: Record<string, unknown>;
  status: "queued" | "running" | "done" | "failed";
  attempts: number;
  max_attempts: number;
  locked_at: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}
