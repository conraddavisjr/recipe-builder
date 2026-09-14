import { NextResponse } from "next/server";
import { apiError, bearerMatches, handle } from "@/lib/api";
import { config } from "@/lib/config";
import * as db from "@/lib/db";

/**
 * POST /api/recipes/reindex (Bearer WORKER_SECRET)
 * Recompute derived, stored verdicts for the whole library (today: the
 * pregnancy-safe flag). Run after the guard's rules change.
 */
export async function POST(request: Request) {
  if (!bearerMatches(request, config.workerSecret)) return apiError("Unauthorized", 401);
  return handle(async () => NextResponse.json(await db.reindexPregnancySafe()));
}
