import { NextResponse, after } from "next/server";
import { handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { kickWorker } from "@/lib/jobs/trigger";
import { InspirationInput } from "@/lib/schemas";

/** GET /api/inspirations -> { inspirations } newest first */
export async function GET() {
  return handle(async () => NextResponse.json({ inspirations: await db.listInspirations() }));
}

/**
 * POST /api/inspirations { dish_name, restaurant_name?, city?, notes?, photo_path? }
 * Creates the record and immediately queues research (web + vision), so a
 * saved inspiration is analyzed without a second click.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, InspirationInput);
    if ("response" in parsed) return parsed.response;
    const inspiration = await db.createInspiration(parsed.data);
    await db.enqueueTask("analyze_inspiration", { inspiration_id: inspiration.id });
    after(() => kickWorker());
    return NextResponse.json({ inspiration }, { status: 201 });
  });
}
