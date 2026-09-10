import { NextResponse, after } from "next/server";
import { apiError, bearerMatches } from "@/lib/api";
import { config } from "@/lib/config";
import * as db from "@/lib/db";
import { isRunDue } from "@/lib/jobs/schedule";
import { kickWorker } from "@/lib/jobs/trigger";

/**
 * GET /api/cron/recommend (Bearer CRON_SECRET)
 * Vercel Cron (or pg_cron) calls this; it reads the latest settings and
 * starts an autonomous run only when one is due. Safe to call often.
 */
export async function GET(request: Request) {
  if (!bearerMatches(request, config.cronSecret)) return apiError("Unauthorized", 401);
  const settings = await db.getSettings();
  const now = new Date();
  if (!isRunDue(settings, now)) {
    return NextResponse.json({ started: false, reason: settings.autonomous_enabled ? "not due" : "autonomous runs disabled" });
  }
  await db.markRunStarted(now);
  const run = await db.createRun({ trigger: "scheduled", requested_count: settings.suggestion_count });
  await db.enqueueTask("generate_recipes", { run_id: run.id }, run.id);
  after(() => kickWorker());
  return NextResponse.json({ started: true, run_id: run.id });
}
