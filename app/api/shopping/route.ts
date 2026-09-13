import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import * as db from "@/lib/db";
import { buildShoppingItems } from "@/lib/shopping";

/**
 * GET /api/shopping -> { cart, history }
 * cart: the open gather run with a freshly built list (staples separated);
 * history: every requested / shopping / done / failed run, newest first.
 */
export async function GET() {
  return handle(async () => {
    const cart = await db.getOrCreateGatheringRun();
    const recipes = await db.recipesForShoppingRun(cart.id);
    const items = buildShoppingItems(recipes, cart.skip_staples);
    const history = await db.listShoppingRuns(["requested", "shopping", "done", "failed"]);
    return NextResponse.json({ cart: { ...cart, items }, history });
  });
}
