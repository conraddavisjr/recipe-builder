import { NextResponse } from "next/server";
import { apiError, handle } from "@/lib/api";
import * as db from "@/lib/db";

/** GET /api/runs/:id -> { run, recipes } (cards produced by the run, any status). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const run = await db.getRun(id);
    if (!run) return apiError("Run not found", 404);
    const status = run.trigger === "generator" ? "candidate" : "saved";
    const recipes = await db.listRecipeCards({ run_id: id, status });
    return NextResponse.json({ run, recipes });
  });
}
