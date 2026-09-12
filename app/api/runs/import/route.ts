import { NextResponse, after } from "next/server";
import { z } from "zod";
import { apiError, bearerMatches, handle, parseBody } from "@/lib/api";
import { config } from "@/lib/config";
import * as db from "@/lib/db";
import { GeneratedBatchSchema } from "@/lib/schemas";
import { guardRecipes } from "@/lib/ai/guard";
import { gatherContext } from "@/lib/jobs/gather";
import { storeBatch } from "@/lib/jobs/handlers";
import { kickWorker } from "@/lib/jobs/trigger";

const Input = z.object({
  prompt: z.string().trim().min(3).max(4000),
  source: z.string().trim().max(200).default("import"),
  recipes: GeneratedBatchSchema.shape.recipes,
});

/**
 * POST /api/runs/import (Bearer WORKER_SECRET)
 * Store a batch of recipes authored outside the model call, through the same
 * validation, constraint guard, run record and rendering as a generated
 * batch. Recipes land as generator drafts.
 */
export async function POST(request: Request) {
  if (!bearerMatches(request, config.workerSecret)) return apiError("Unauthorized", 401);
  return handle(async () => {
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const { prompt, source, recipes } = parsed.data;
    const context = await gatherContext();
    const issues = guardRecipes(recipes, context);
    if (issues.length > 0) return apiError(`Batch violates hard constraints: ${issues.map((i) => `${i.recipe}: ${i.issue}`).join("; ")}`, 422);
    const settings = await db.getSettings();
    const run = await db.createRun({ trigger: "generator", requested_count: recipes.length, prompt });
    await db.updateRun(run.id, { status: "generating", started_at: new Date().toISOString() });
    const fresh = await db.getRun(run.id);
    if (!fresh) return apiError("Run vanished", 500);
    const ids = await storeBatch(fresh, recipes, settings, { prompt, review: { issues: [], repaired: false }, source });
    after(() => kickWorker());
    return NextResponse.json({ run_id: run.id, recipe_ids: ids }, { status: 201 });
  });
}
