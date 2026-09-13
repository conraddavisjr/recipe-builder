import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import * as db from "@/lib/db";

/** GET /api/shopping/count -> { count } recipes in the open cart. */
export async function GET() {
  return handle(async () => NextResponse.json({ count: await db.countGatheringRecipes() }));
}
