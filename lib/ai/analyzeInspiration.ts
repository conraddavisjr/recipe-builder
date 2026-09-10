import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { InspirationAnalysisSchema } from "@/lib/schemas";
import type { Inspiration, InspirationAnalysis } from "@/lib/types";
import { CLAUDE_MODEL, getClaude } from "./claude";

/**
 * Research a restaurant dish: web search for the restaurant and menu, look at
 * the photo if there is one, then produce a structured analysis that labels
 * every ingredient as verified (seen in a source), inferred (deduced from the
 * photo, cuisine or dish name) or user-provided (from corrections).
 *
 * Two calls: an agentic research turn with server-side web tools (manual
 * loop so pause_turn is handled), then a parse call that shapes the findings.
 */

const RESEARCH_SYSTEM = `You are a culinary researcher. Given a dish a person ate at a restaurant, find out what it actually is.

Method:
1. Search for the restaurant (name plus city) to confirm it exists and learn its cuisine, style and reputation. Prefer the restaurant's own site, menu pages, and reputable reviews.
2. Search for the dish on that restaurant's menu. Quote the menu description verbatim if you find it.
3. If a photo is provided, describe what you can actually see: proteins, vegetables, sauces, garnishes, cooking evidence (char, sear, glaze), plating and vessel.
4. Combine all of it into a candidate ingredient list. For each ingredient say whether it is verified (named in a source), or inferred (your deduction), with your confidence. Note the techniques you believe were used and the flavor balance.
5. List the sources you used with their URLs. Be honest about what you could not verify.

Do not invent sources. If the restaurant cannot be found, say so and reason from the dish name, cuisine and photo alone. Use plain hyphens, never em dashes.`;

const PARSE_SYSTEM = `Convert research notes about a restaurant dish into the required JSON. Every ingredient must carry provenance: "verified" only when a cited source names it, "inferred" otherwise, "user_provided" for anything the person themselves listed. Confidence is 0 to 1. Copy source URLs exactly. Keep restaurant_summary and menu_description short and factual. Use plain hyphens, never em dashes.`;

export async function analyzeInspiration(
  inspiration: Inspiration,
  photo: { bytes: Uint8Array; contentType: string } | null,
): Promise<InspirationAnalysis> {
  const client = getClaude();
  const corrections = inspiration.user_ingredients.map((c) => (c.note ? `${c.name} (${c.note})` : c.name)).join(", ");

  const content: Anthropic.ContentBlockParam[] = [];
  if (photo) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType(photo.contentType), data: Buffer.from(photo.bytes).toString("base64") },
    });
  }
  content.push({
    type: "text",
    text: [
      `Dish: ${inspiration.dish_name}`,
      inspiration.restaurant_name ? `Restaurant: ${inspiration.restaurant_name}` : "Restaurant: (not given)",
      inspiration.city ? `City: ${inspiration.city}` : "",
      inspiration.notes ? `Person's notes: ${inspiration.notes}` : "",
      corrections ? `Ingredients the person says are in it (treat as ground truth): ${corrections}` : "",
      photo ? "A photo of the dish is attached." : "No photo.",
      "",
      "Research this dish and report your findings as notes.",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  // Manual loop: server tools may return pause_turn on long research turns.
  const messages: Anthropic.MessageParam[] = [{ role: "user", content }];
  let notes = "";
  for (let i = 0; i < 6; i++) {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: RESEARCH_SYSTEM,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 8 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6 },
      ],
      messages,
    });
    if (response.stop_reason === "refusal") {
      throw new Error(`Research refused: ${response.stop_details?.explanation ?? "no explanation"}`);
    }
    notes = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    break;
  }
  if (!notes.trim()) throw new Error("Research produced no notes");

  const parsed = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: zodOutputFormat(InspirationAnalysisSchema) },
    system: PARSE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Dish: ${inspiration.dish_name}${inspiration.restaurant_name ? ` at ${inspiration.restaurant_name}` : ""}\n${corrections ? `Person-provided ingredients: ${corrections}\n` : ""}\nResearch notes:\n${notes}`,
      },
    ],
  });
  if (!parsed.parsed_output) throw new Error("Could not structure the research notes");
  return parsed.parsed_output;
}

/**
 * The person corrected the ingredient list. Re-derive the fuller picture
 * (proportions, hidden ingredients, technique) with the corrections as
 * ground truth, keeping provenance on everything that was already known.
 */
export async function reanalyzeIngredients(inspiration: Inspiration): Promise<InspirationAnalysis> {
  const corrections = inspiration.user_ingredients.map((c) => (c.note ? `${c.name} (${c.note})` : c.name)).join(", ");
  const parsed = await getClaude().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(InspirationAnalysisSchema) },
    system: `You refine an analysis of a restaurant dish after the person corrected its ingredient list. Their corrections are ground truth and must appear with provenance "user_provided". Keep previously verified items as "verified" with their sources unless a correction contradicts them; keep inferred items only if they remain plausible alongside the corrections, and add any ingredients or techniques the corrections now imply (for example, a correction naming "gochugaru" implies Korean chili heat and probably garlic and sesame oil). Update flavor_notes and techniques to match. Use plain hyphens, never em dashes.`,
    messages: [
      {
        role: "user",
        content: `Dish: ${inspiration.dish_name}${inspiration.restaurant_name ? ` at ${inspiration.restaurant_name}` : ""}${inspiration.city ? `, ${inspiration.city}` : ""}\nNotes: ${inspiration.notes || "(none)"}\n\nPerson's corrected ingredients: ${corrections || "(none)"}\n\nPrevious analysis JSON:\n${JSON.stringify(inspiration.analysis ?? {}, null, 2)}`,
      },
    ],
  });
  if (!parsed.parsed_output) throw new Error("Could not re-analyze ingredients");
  return parsed.parsed_output;
}

function mediaType(ct: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (ct === "image/png" || ct === "image/webp" || ct === "image/gif") return ct;
  return "image/jpeg";
}
