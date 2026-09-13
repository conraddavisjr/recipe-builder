import { NextResponse, after } from "next/server";
import { apiError, bearerMatches, handle, parseBody } from "@/lib/api";
import { config } from "@/lib/config";
import * as db from "@/lib/db";
import { StepMediaImportInput } from "@/lib/schemas";
import { queueStepMedia } from "@/lib/jobs/handlers";
import { kickWorker } from "@/lib/jobs/trigger";

/**
 * POST /api/step-media/import (Bearer WORKER_SECRET)
 * Queue step stills or clips from prompts an agent wrote by hand, one per
 * step number. Same rows and render tasks as the detail-page action.
 */
export async function POST(request: Request) {
  if (!bearerMatches(request, config.workerSecret)) return apiError("Unauthorized", 401);
  return handle(async () => {
    const parsed = await parseBody(request, StepMediaImportInput);
    if ("response" in parsed) return parsed.response;
    const { recipe_id, kind, seconds, prompts } = parsed.data;
    const recipe = await db.getRecipe(recipe_id);
    if (!recipe) return apiError("Recipe not found", 404);
    const known = new Set(recipe.steps.map((s) => s.number));
    const unknown = prompts.filter((p) => !known.has(p.step_number)).map((p) => p.step_number);
    if (unknown.length) return apiError(`Recipe has no step ${unknown.join(", ")}`, 422);
    const rows = await queueStepMedia(recipe_id, kind, prompts, seconds);
    after(() => kickWorker());
    return NextResponse.json({ step_media: rows }, { status: 201 });
  });
}
