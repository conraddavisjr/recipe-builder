import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { InspirationInput, UserIngredientSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

const Patch = InspirationInput.partial().extend({
  user_ingredients: z.array(UserIngredientSchema).max(80).optional(),
});

/** GET /api/inspirations/:id -> { inspiration } */
export async function GET(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const inspiration = await db.getInspiration(id);
    if (!inspiration) return apiError("Inspiration not found", 404);
    return NextResponse.json({ inspiration });
  });
}

/** PATCH /api/inspirations/:id { fields..., user_ingredients? } -> { inspiration }. Marks analysis stale. */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Patch);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ inspiration: await db.updateInspiration(id, parsed.data) });
  });
}

/** DELETE /api/inspirations/:id -> { ok } */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    await db.deleteInspiration(id);
    return NextResponse.json({ ok: true });
  });
}
