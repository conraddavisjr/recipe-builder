import OpenAI from "openai";
import { config } from "@/lib/config";

let cached: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local to generate imagery.");
  }
  if (!cached) cached = new OpenAI({ apiKey: config.openaiApiKey, maxRetries: 2 });
  return cached;
}

/**
 * Style anchors. Every food photo and every ingredient illustration in the
 * app comes through one of these two prompts so the library looks like one
 * publication rather than a scrapbook.
 */
const FOOD_PHOTO_STYLE =
  "Editorial food photography, natural window light, shallow depth of field, real ceramic and linen textures, appetizing and honest, no text, no people, no hands, no watermark.";

const INGREDIENT_ART_STYLE =
  "A single ingredient illustrated in a warm hand-drawn cookbook style: soft watercolor wash with fine ink linework, gentle shadows, centered, isolated on a clean pure white background, no text, no labels, no border, no other objects.";

export interface GeneratedImage {
  bytes: Uint8Array;
  contentType: "image/webp";
}

async function generate(prompt: string, size: string, quality: "low" | "medium" | "high"): Promise<GeneratedImage> {
  const result = await getOpenAI().images.generate({
    model: config.openaiImageModel,
    prompt,
    size,
    quality,
    output_format: "webp",
    n: 1,
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image API returned no image data");
  return { bytes: new Uint8Array(Buffer.from(b64, "base64")), contentType: "image/webp" };
}

/** Landscape hero or angle shot of a finished dish. */
export function generateFoodPhoto(subjectPrompt: string): Promise<GeneratedImage> {
  return generate(`${subjectPrompt}\n\n${FOOD_PHOTO_STYLE}`, "1536x1024", "medium");
}

/** Square illustration for one ingredient, cached forever by key. */
export function generateIngredientArt(displayName: string): Promise<GeneratedImage> {
  return generate(`${displayName}. ${INGREDIENT_ART_STYLE}`, "1024x1024", "low");
}

export function ingredientArtPrompt(displayName: string): string {
  return `${displayName}. ${INGREDIENT_ART_STYLE}`;
}
