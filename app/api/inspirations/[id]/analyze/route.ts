import { NextResponse, after } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { kickWorker } from "@/lib/jobs/trigger";

const Input = z.object({ mode: z.enum(["research", "reanalyze"]).default("research") });

/**
 * POST /api/inspirations/:id/analyze { mode }
 *  research   - full web + photo research from scratch
 *  reanalyze  - fold the person's ingredient corrections into the analysis
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const inspiration = await db.getInspiration(id);
    if (!inspiration) return apiError("Inspiration not found", 404);
    const type = parsed.data.mode === "reanalyze" && inspiration.analysis ? "reanalyze_ingredients" : "analyze_inspiration";
    await db.setInspirationAnalysis(id, { analysis_status: "pending", analysis_error: null });
    await db.enqueueTask(type, { inspiration_id: id });
    after(() => kickWorker());
    return NextResponse.json({ queued: type });
  });
}
