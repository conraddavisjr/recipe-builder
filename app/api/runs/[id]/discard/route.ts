import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

const Input = z.object({ recipe_ids: z.array(z.string().uuid()).min(1) });

/**
 * POST /api/runs/:id/discard { recipe_ids } -> { discarded }
 * Deletes the named drafts of this run. Refuses anything already kept, so a
 * stale page can never delete a recipe that is in the library.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const run = await db.getRun(id);
    if (!run) return apiError("Run not found", 404);
    const drafts = await db.listRecipeCards({ run_id: id, status: "candidate" });
    const wanted = new Set(parsed.data.recipe_ids);
    const discarded = drafts.filter((d) => wanted.has(d.id)).map((d) => d.id);
    await db.deleteRecipes(discarded);
    return NextResponse.json({ discarded });
  });
}
