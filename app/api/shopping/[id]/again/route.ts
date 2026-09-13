import { NextResponse } from "next/server";
import { apiError, handle } from "@/lib/api";
import * as db from "@/lib/db";

/** POST /api/shopping/:id/again -> { cart }. Adds a past run's recipes to the open cart. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const past = await db.getShoppingRun(id);
    if (!past) return apiError("Shopping run not found", 404);
    const cart = await db.getOrCreateGatheringRun();
    for (const r of past.recipes) await db.addRecipeToShoppingRun(cart.id, r.id);
    return NextResponse.json({ cart: await db.getShoppingRun(cart.id) });
  });
}
