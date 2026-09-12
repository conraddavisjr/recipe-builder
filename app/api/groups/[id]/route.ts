import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";
import { consolidateIngredients } from "@/lib/groups";

type Ctx = { params: Promise<{ id: string }> };
const Patch = z.object({ name: z.string().trim().min(1).max(120).optional(), description: z.string().trim().max(2000).optional() });

/** GET /api/groups/:id -> { group, recipes (cards), shopping_list } */
export async function GET(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const found = await db.getGroup(id);
    if (!found) return apiError("Group not found", 404);
    const shopping_list = consolidateIngredients(found.recipes);
    const recipes = found.recipes.map(({ steps: _s, equipment: _e, image_prompts: _p, ...card }) => {
      void _s; void _e; void _p;
      return card;
    });
    return NextResponse.json({ group: found.group, recipes, shopping_list });
  });
}

/** PATCH /api/groups/:id { name?, description? } -> { ok } */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Patch);
    if ("response" in parsed) return parsed.response;
    await db.updateGroup(id, parsed.data);
    return NextResponse.json({ ok: true });
  });
}

/** DELETE /api/groups/:id -> { ok }. Recipes themselves are untouched. */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    await db.deleteGroup(id);
    return NextResponse.json({ ok: true });
  });
}
