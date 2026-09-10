import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

const KeepInput = z.object({ keep_ids: z.array(z.string().uuid()) });

/**
 * POST /api/runs/:id/keep { keep_ids } -> { kept, discarded }
 * Promotes chosen generator candidates into the library and deletes the
 * rest (with their images) so drafts never linger in storage.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, KeepInput);
    if ("response" in parsed) return parsed.response;
    const run = await db.getRun(id);
    if (!run) return apiError("Run not found", 404);
    const candidates = await db.listRecipeCards({ run_id: id, status: "candidate" });
    const keep = new Set(parsed.data.keep_ids);
    const kept = candidates.filter((c) => keep.has(c.id)).map((c) => c.id);
    const discarded = candidates.filter((c) => !keep.has(c.id)).map((c) => c.id);
    await db.setRecipeStatus(kept, "saved");
    await db.deleteRecipes(discarded);
    return NextResponse.json({ kept, discarded });
  });
}
