import { buildContext, type RecommendationContext } from "@/lib/ai/context";
import * as db from "@/lib/db";

/**
 * Assemble the recommendation context from the database. Everything the
 * person has told or shown the app is loaded fresh at the moment the run
 * starts, so the latest settings and instructions always win.
 */
export async function gatherContext(): Promise<RecommendationContext> {
  const [settings, selections, instructions, inspirations, feedback, recentTitles] = await Promise.all([
    db.getSettings(),
    db.listProfileSelections(),
    db.listInstructions({ includeInactive: true }),
    db.listInspirations(),
    db.listRecipeFeedback(),
    db.listRecentRecipeTitles(),
  ]);
  const recipeIds = instructions.map((i) => i.recipe_id).filter((id): id is string => Boolean(id));
  const titled = await db.getRecipeCardsByIds([...new Set(recipeIds)]);
  const recipeTitles = new Map(titled.map((r) => [r.id, r.title]));
  return buildContext({ settings, selections, instructions, inspirations, feedback, recentTitles, recipeTitles });
}
