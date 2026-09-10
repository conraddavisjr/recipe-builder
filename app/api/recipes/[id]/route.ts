import { NextResponse } from "next/server";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { RecipeFeedbackInput } from "@/lib/schemas";
import { findSimilar } from "@/lib/similarity";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/recipes/:id -> { recipe, ingredient_art, similar } */
export async function GET(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const recipe = await db.getRecipe(id);
    if (!recipe) return apiError("Recipe not found", 404);
    const [artMap, library] = await Promise.all([
      db.getIngredientArt(recipe.ingredients.map((i) => i.ingredient_key)),
      db.listRecipesForSimilarity(),
    ]);
    const neighbors = findSimilar(recipe, library, { limit: 6 });
    const similar = await db.getRecipeCardsByIds(neighbors.map((n) => n.recipe.id));
    return NextResponse.json({
      recipe,
      ingredient_art: Object.fromEntries(artMap),
      similar: similar.map((card) => ({ ...card, score: neighbors.find((n) => n.recipe.id === card.id)?.score ?? 0 })),
    });
  });
}

/** PATCH /api/recipes/:id { favorite?, rating?, feedback? } -> { recipe } */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, RecipeFeedbackInput);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ recipe: await db.updateRecipeFeedback(id, parsed.data) });
  });
}

/** DELETE /api/recipes/:id -> { ok }. Removes the recipe and its images. */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const recipe = await db.getRecipe(id);
    if (!recipe) return apiError("Recipe not found", 404);
    await db.deleteRecipes([id]);
    return NextResponse.json({ ok: true });
  });
}
