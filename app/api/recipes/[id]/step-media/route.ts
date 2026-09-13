import { NextResponse, after } from "next/server";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { StepMediaInput } from "@/lib/schemas";
import { storyboard } from "@/lib/ai/storyboard";
import { queueStepMedia } from "@/lib/jobs/handlers";
import { kickWorker } from "@/lib/jobs/trigger";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/recipes/:id/step-media -> { step_media } */
export async function GET(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    return NextResponse.json({ step_media: await db.listStepMedia(id) });
  });
}

/**
 * POST /api/recipes/:id/step-media { kind, seconds? } -> { step_media }
 * Illustrate every step of the recipe with a still or a short clip. Prompts
 * come from the deterministic storyboard; rendering runs on the queue.
 */
export async function POST(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, StepMediaInput);
    if ("response" in parsed) return parsed.response;
    const recipe = await db.getRecipe(id);
    if (!recipe) return apiError("Recipe not found", 404);
    const { kind, seconds } = parsed.data;
    const rows = await queueStepMedia(id, kind, storyboard(recipe, kind, seconds), seconds);
    after(() => kickWorker());
    return NextResponse.json({ step_media: rows }, { status: 201 });
  });
}
