import { NextResponse } from "next/server";
import { handle, parseBody } from "@/lib/api";
import { SettingsInput } from "@/lib/schemas";
import { getSettings, updateSettings } from "@/lib/db";

/** GET /api/settings -> { settings } */
export async function GET() {
  return handle(async () => NextResponse.json({ settings: await getSettings() }));
}

/** PATCH /api/settings { ...partial } -> { settings } */
export async function PATCH(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, SettingsInput);
    if ("response" in parsed) return parsed.response;
    return NextResponse.json({ settings: await updateSettings(parsed.data) });
  });
}
