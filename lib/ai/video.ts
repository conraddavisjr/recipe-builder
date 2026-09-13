import OpenAI from "openai";
import { config } from "@/lib/config";

/**
 * Short clips for method steps through the video API. Jobs are
 * asynchronous: start one, poll it, then download the MP4 and its poster
 * frame. The worker keeps the job id on the step_media row so a clip that
 * outlives one worker slice is picked up by the next.
 */

let cached: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local to generate video.");
  }
  if (!cached) cached = new OpenAI({ apiKey: config.openaiApiKey, maxRetries: 2 });
  return cached;
}

/** Landscape, matches the 3:2 stills closely enough to sit in the same slot. */
const CLIP_SIZE = "1280x720" as const;

export type ClipSeconds = 4 | 8 | 12;

export interface ClipJob {
  id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  error: string | null;
}

function toJob(v: OpenAI.Videos.Video): ClipJob {
  return {
    id: v.id,
    status: v.status,
    progress: v.progress ?? 0,
    error: v.error ? `${v.error.code}: ${v.error.message}` : null,
  };
}

export async function startStepClip(prompt: string, seconds: ClipSeconds): Promise<ClipJob> {
  const video = await getOpenAI().videos.create({
    model: config.openaiVideoModel,
    prompt,
    seconds: String(seconds) as "4" | "8" | "12",
    size: CLIP_SIZE,
  });
  return toJob(video);
}

export async function pollStepClip(jobId: string): Promise<ClipJob> {
  return toJob(await getOpenAI().videos.retrieve(jobId));
}

export interface ClipAssets {
  video: Uint8Array;
  poster: { bytes: Uint8Array; contentType: string } | null;
}

export async function downloadStepClip(jobId: string): Promise<ClipAssets> {
  const client = getOpenAI();
  const videoRes = await client.videos.downloadContent(jobId);
  const video = new Uint8Array(await videoRes.arrayBuffer());
  let poster: ClipAssets["poster"] = null;
  try {
    const posterRes = await client.videos.downloadContent(jobId, { variant: "thumbnail" });
    poster = { bytes: new Uint8Array(await posterRes.arrayBuffer()), contentType: posterRes.headers.get("content-type") ?? "image/webp" };
  } catch {
    // A missing poster only costs the first frame; the clip still plays.
  }
  return { video, poster };
}
