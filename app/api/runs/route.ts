import { NextResponse, after } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { kickWorker } from "@/lib/jobs/trigger";
import { SimilarityAxis } from "@/lib/schemas";

const StartRunInput = z.discriminatedUnion("trigger", [
  z.object({ trigger: z.literal("manual"), count: z.number().int().min(1).max(12).optional() }),
  z.object({ trigger: z.literal("generator"), prompt: z.string().trim().min(3).max(2000), count: z.number().int().min(1).max(8).optional() }),
  z.object({
    trigger: z.literal("similar"),
    similar_to_id: z.string().uuid(),
    axes: z.array(SimilarityAxis).min(1),
    count: z.number().int().min(1).max(8).optional(),
  }),
  z.object({ trigger: z.literal("inspiration"), inspiration_id: z.string().uuid(), count: z.number().int().min(1).max(5).optional() }),
]);

/** GET /api/runs -> { runs } newest first, with task progress. */
export async function GET() {
  return handle(async () => NextResponse.json({ runs: await db.listRuns() }));
}

/** POST /api/runs { trigger, ... } -> { run }. Enqueues generation and pokes the worker. */
export async function POST(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, StartRunInput);
    if ("response" in parsed) return parsed.response;
    const input = parsed.data;
    const settings = await db.getSettings();
    const count = input.count ?? (input.trigger === "manual" ? settings.suggestion_count : input.trigger === "inspiration" ? 1 : 3);

    const run = await db.createRun({
      trigger: input.trigger,
      requested_count: count,
      prompt: input.trigger === "generator" ? input.prompt : null,
      similar_to_id: input.trigger === "similar" ? input.similar_to_id : null,
      similarity_axes: input.trigger === "similar" ? input.axes : null,
      inspiration_id: input.trigger === "inspiration" ? input.inspiration_id : null,
    });
    if (input.trigger === "manual") await db.markRunStarted(new Date());
    await db.enqueueTask("generate_recipes", { run_id: run.id }, run.id);
    after(() => kickWorker());
    return NextResponse.json({ run }, { status: 201 });
  });
}
