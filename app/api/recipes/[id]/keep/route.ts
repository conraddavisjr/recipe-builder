import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

const Input = z.object({ keep: z.boolean() });

/**
 * POST /api/recipes/:id/keep { keep } -> { recipe }
 * Keeping a generator draft writes status=saved to the database at once, so
 * the choice survives a refresh and the recipe is in the library immediately.
 * keep=false returns it to draft; nothing is ever deleted here.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const recipe = await db.getRecipe(id);
    if (!recipe) return apiError("Recipe not found", 404);
    await db.setRecipeStatus([id], parsed.data.keep ? "saved" : "candidate");
    return NextResponse.json({ recipe: await db.getRecipe(id) });
  });
}
