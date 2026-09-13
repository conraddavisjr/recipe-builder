import { NextResponse } from "next/server";
import { apiError, handle } from "@/lib/api";
import * as db from "@/lib/db";
import { autoRunName, buildShoppingItems } from "@/lib/shopping";

/**
 * POST /api/shopping/:id/request -> { run }
 * "Shop for me": freezes the list into `items`, names the run if unnamed,
 * and marks it requested so a fulfilling agent can pick it up.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const run = await db.getShoppingRun(id);
    if (!run) return apiError("Shopping run not found", 404);
    if (run.status !== "gathering") return apiError("This run was already requested", 409);
    const recipes = await db.recipesForShoppingRun(id);
    if (recipes.length === 0) return apiError("Add at least one recipe first", 400);
    const items = buildShoppingItems(recipes, run.skip_staples);
    const updated = await db.updateShoppingRun(id, {
      status: "requested",
      items,
      name: run.name || autoRunName(recipes.map((r) => r.title)),
      requested_at: new Date().toISOString(),
    });
    return NextResponse.json({ run: updated });
  });
}
