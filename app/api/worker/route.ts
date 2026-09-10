import { NextResponse, after } from "next/server";
import { apiError, bearerMatches } from "@/lib/api";
import { config } from "@/lib/config";
import { drain } from "@/lib/jobs/worker";
import { kickWorker } from "@/lib/jobs/trigger";

// Fluid compute: Hobby caps at 300s. The drain slice leaves headroom.
export const maxDuration = 300;

/** POST /api/worker (Bearer WORKER_SECRET) -> drains the task queue for one slice. */
export async function POST(request: Request) {
  if (!bearerMatches(request, config.workerSecret)) return apiError("Unauthorized", 401);
  const report = await drain();
  if (report.remaining > 0) after(() => kickWorker());
  return NextResponse.json(report);
}
