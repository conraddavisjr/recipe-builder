import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };
const Patch = z.object({ name: z.string().trim().max(120).optional(), skip_staples: z.boolean().optional(), notes: z.string().trim().max(4000).optional() });

/** GET /api/shopping/:id -> { run } */
export async function GET(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const run = await db.getShoppingRun(id);
    if (!run) return apiError("Shopping run not found", 404);
    return NextResponse.json({ run });
  });
}

/** PATCH /api/shopping/:id { name?, skip_staples?, notes? } -> { run } */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Patch);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ run: await db.updateShoppingRun(id, parsed.data) });
  });
}

/** DELETE /api/shopping/:id -> { ok } */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    await db.deleteShoppingRun(id);
    return NextResponse.json({ ok: true });
  });
}
