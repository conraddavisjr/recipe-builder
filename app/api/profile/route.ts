import { NextResponse } from "next/server";
import { handle, parseBody } from "@/lib/api";
import { ProfileToggleInput } from "@/lib/schemas";
import { listProfileSelections, setProfileSelection } from "@/lib/db";

/** GET /api/profile -> { selections } (every row, active or not) */
export async function GET() {
  return handle(async () => NextResponse.json({ selections: await listProfileSelections() }));
}

/** PUT /api/profile { category, key, active } -> { selection } */
export async function PUT(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, ProfileToggleInput);
    if ("response" in parsed) return parsed.response;
    const { category, key, active } = parsed.data;
    return NextResponse.json({ selection: await setProfileSelection(category, key, active) });
  });
}
