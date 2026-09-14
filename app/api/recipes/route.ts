import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import * as db from "@/lib/db";

/**
 * GET /api/recipes?q=&cuisine=&dish_type=&health_profile=&presentation=&source=&favorites=1&pregnancy_safe=1&sort=
 * -> { recipes, active_runs, drafts } (drafts = generator candidates not yet kept)
 */
export async function GET(request: Request) {
  return handle(async () => {
    const p = new URL(request.url).searchParams;
    const pick = (k: string) => p.get(k)?.trim() || undefined;
    const [recipes, active_runs, drafts] = await Promise.all([
      db.listRecipeCards({
        q: pick("q"),
        cuisine: pick("cuisine"),
        dish_type: pick("dish_type"),
        health_profile: pick("health_profile"),
        presentation: pick("presentation"),
        source: pick("source") as "autonomous" | "generator" | "similar" | "inspiration" | undefined,
        favorites: p.get("favorites") === "1",
        pregnancy_safe: p.get("pregnancy_safe") === "1",
        sort: (pick("sort") as "newest" | "oldest" | "title" | "quickest" | undefined) ?? "newest",
      }),
      db.listActiveRuns(),
      db.countCandidates(),
    ]);
    return NextResponse.json({ recipes, active_runs, drafts });
  });
}
