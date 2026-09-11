import { NextResponse } from "next/server";
import { apiError, handle } from "@/lib/api";
import * as db from "@/lib/db";

/** GET /api/runs/:id -> { run, recipes } (every card the run produced, kept or draft). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const run = await db.getRun(id);
    if (!run) return apiError("Run not found", 404);
    const recipes = await db.listRecipeCards({ run_id: id, status: "any", sort: "oldest" });
    return NextResponse.json({ run, recipes });
  });
}
