import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };
const Input = z.object({ recipe_id: z.string().uuid() });

/** POST /api/groups/:id/recipes { recipe_id } -> { ok } (idempotent) */
export async function POST(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    await db.addRecipeToGroup(id, parsed.data.recipe_id);
    return NextResponse.json({ ok: true });
  });
}

/** DELETE /api/groups/:id/recipes { recipe_id } -> { ok } */
export async function DELETE(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    await db.removeRecipeFromGroup(id, parsed.data.recipe_id);
    return NextResponse.json({ ok: true });
  });
}
