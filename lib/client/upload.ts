import { api } from "./api";

/**
 * Upload a photo straight from the browser to Supabase Storage using a
 * signed upload URL from our API. The bytes never touch the app server.
 */
export async function uploadPhoto(file: File): Promise<string> {
  const contentType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/heic";
  const { url, path } = await api<{ url: string; token: string; path: string }>("/api/inspirations/upload-url", {
    method: "POST",
    json: { filename: file.name, content_type: contentType },
  });
  const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": contentType, "x-upsert": "true" } });
  if (!res.ok) throw new Error(`Photo upload failed (${res.status})`);
  return path;
}
