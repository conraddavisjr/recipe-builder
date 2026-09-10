import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import * as db from "@/lib/db";

const Input = z.object({
  filename: z.string().min(1).max(200),
  content_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]),
});

/**
 * POST /api/inspirations/upload-url { filename, content_type } -> { url, token, path }
 * The browser PUTs the file straight to Storage; photos never pass through
 * the app server (Vercel bodies cap at 4.5 MB).
 */
export async function POST(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const ext = parsed.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `photos/${crypto.randomUUID()}.${ext}`;
    return NextResponse.json(await db.createPhotoUploadUrl(path));
  });
}
