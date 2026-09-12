import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

const GroupInput = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).optional() });

/** GET /api/groups -> { groups } newest first, with recipe counts and cover images */
export async function GET() {
  return handle(async () => NextResponse.json({ groups: await db.listGroups() }));
}

/** POST /api/groups { name, description? } -> { group } */
export async function POST(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, GroupInput);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ group: await db.createGroup(parsed.data) }, { status: 201 });
  });
}
