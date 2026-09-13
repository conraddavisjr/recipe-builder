import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };
const Input = z.object({ recipe_id: z.string().uuid() });

/** POST /api/shopping/:id/recipes { recipe_id } -> { ok } (only while gathering) */
export async function POST(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const run = await db.getShoppingRun(id);
    if (!run) return apiError("Shopping run not found", 404);
    if (run.status !== "gathering") return apiError("This run is no longer open", 409);
    await db.addRecipeToShoppingRun(id, parsed.data.recipe_id);
    return NextResponse.json({ ok: true });
  });
}

/** DELETE /api/shopping/:id/recipes { recipe_id } -> { ok } */
export async function DELETE(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    await db.removeRecipeFromShoppingRun(id, parsed.data.recipe_id);
    return NextResponse.json({ ok: true });
  });
}
