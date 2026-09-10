import { NextResponse } from "next/server";
import { handle, parseBody } from "@/lib/api";
import { InstructionPatch } from "@/lib/schemas";
import { deleteInstruction, updateInstruction } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/instructions/:id { body?, tier?, active? } -> { instruction } */
export async function PATCH(request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, InstructionPatch);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ instruction: await updateInstruction(id, parsed.data) });
  });
}

/** DELETE /api/instructions/:id -> { ok } */
export async function DELETE(_request: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    await deleteInstruction(id);
    return NextResponse.json({ ok: true });
  });
}
