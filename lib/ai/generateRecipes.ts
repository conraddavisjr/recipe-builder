import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GeneratedBatchSchema } from "@/lib/schemas";
import type { GeneratedRecipe } from "@/lib/types";
import { CLAUDE_MODEL, RECIPE_SYSTEM_PROMPT, getClaude } from "./claude";
import { renderContext, renderRequest, type GenerationMode, type RecommendationContext } from "./context";
import { guardRecipes } from "./guard";
import { reviewRecipes } from "./reviewRecipes";

export interface GenerationResult {
  recipes: GeneratedRecipe[];
  /** The exact prompt text the model saw, stored on the run for the history page. */
  prompt: string;
  review: { issues: string[]; repaired: boolean };
  usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens: number };
}

/**
 * One streamed generation call with structured output, followed by a cheap
 * guard + review pass. If the review finds hard-constraint violations, one
 * repair round asks the model to fix exactly those recipes.
 */
export async function generateRecipes(input: {
  context: RecommendationContext;
  mode: GenerationMode;
  count: number;
  imagesPerRecipe: number;
}): Promise<GenerationResult> {
  const prompt = `${renderContext(input.context)}\n# Request\n${renderRequest(input.mode, input.count, input.imagesPerRecipe)}`;
  const first = await callModel(prompt);
  let recipes = first.recipes;
  const usage = first.usage;

  const guardIssues = guardRecipes(recipes, input.context).map((i) => `${i.recipe}: ${i.issue}`);
  const review = await reviewRecipes(recipes, input.context);
  const issues = [...guardIssues, ...review.issues];
  let repaired = false;

  if (issues.length > 0) {
    const repairPrompt = `${prompt}\n\n# Repair\nYour previous batch violated these constraints:\n${issues.map((i) => `- ${i}`).join("\n")}\n\nReturn the full batch again with the offending recipes replaced or fixed. Keep the compliant recipes unchanged.`;
    const second = await callModel(repairPrompt);
    recipes = second.recipes;
    usage.input_tokens += second.usage.input_tokens;
    usage.output_tokens += second.usage.output_tokens;
    usage.cache_read_input_tokens += second.usage.cache_read_input_tokens;
    repaired = true;
  }

  return { recipes, prompt, review: { issues, repaired }, usage };
}

async function callModel(prompt: string): Promise<{ recipes: GeneratedRecipe[]; usage: GenerationResult["usage"] }> {
  const client = getClaude();
  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: zodOutputFormat(GeneratedBatchSchema) },
    system: [{ type: "text", text: RECIPE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(`Model refused: ${message.stop_details?.explanation ?? "no explanation"}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Model output was truncated (max_tokens). Try fewer recipes per run.");
  }
  const text = message.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = GeneratedBatchSchema.parse(JSON.parse(text));
  return {
    recipes: parsed.recipes,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
    },
  };
}
