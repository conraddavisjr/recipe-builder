import { NextResponse } from "next/server";
import { handle, parseBody } from "@/lib/api";
import { InstructionInput } from "@/lib/schemas";
import { createInstruction, listInstructions } from "@/lib/db";

/** GET /api/instructions?all=1 -> { instructions } newest first */
export async function GET(request: Request) {
  return handle(async () => {
    const all = new URL(request.url).searchParams.get("all") === "1";
    return NextResponse.json({ instructions: await listInstructions({ includeInactive: all }) });
  });
}

/** POST /api/instructions { tier, body, recipe_id? } -> { instruction } */
export async function POST(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, InstructionInput);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ instruction: await createInstruction(parsed.data) }, { status: 201 });
  });
}
