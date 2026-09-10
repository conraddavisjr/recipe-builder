import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { GeneratedRecipe } from "@/lib/types";
import { CLAUDE_MODEL, getClaude } from "./claude";
import type { RecommendationContext } from "./context";

const ReviewSchema = z.object({
  violations: z.array(
    z.object({
      recipe_title: z.string(),
      constraint: z.string(),
      explanation: z.string(),
    }),
  ),
});

/**
 * Second-opinion pass at low effort: does any recipe break a hard rule
 * (dietary absolute, avoided cuisine, absolute truth, cookware not owned)?
 * Soft preferences are deliberately out of scope; this is a safety net, not
 * a taste critic.
 */
export async function reviewRecipes(recipes: GeneratedRecipe[], ctx: RecommendationContext): Promise<{ issues: string[] }> {
  const constraints = [
    ...ctx.profile.diet_absolute.map((d) => `Dietary absolute: ${d.label} (${d.description})`),
    ...ctx.profile.cuisine_avoid.map((c) => `Avoided cuisine: ${c.label}`),
    ...ctx.truths.map((t) => `Absolute truth: ${t.body}`),
    `Cookware available: ${ctx.profile.cookware.map((c) => c.label).join(", ") || "(unspecified; assume a normal home kitchen)"}`,
    `Maximum total cooking time: ${ctx.settings.max_cook_minutes} minutes`,
  ];
  if (constraints.length <= 2 && ctx.profile.cookware.length === 0) return { issues: [] };

  const summary = recipes
    .map(
      (r) =>
        `### ${r.title}\nCuisine: ${r.cuisine}. Total time: ${r.total_minutes} min.\nIngredients: ${r.ingredients.map((i) => i.name).join(", ")}\nEquipment: ${r.equipment.map((e) => e.name).join(", ")}`,
    )
    .join("\n\n");

  const response = await getClaude().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: zodOutputFormat(ReviewSchema) },
    system:
      "You audit recipes against a person's hard constraints. Report only clear violations of the listed constraints; do not comment on taste, style or nutrition. Hidden ingredients count (fish sauce is fish, soy sauce contains wheat, Worcestershire contains anchovy). An empty violations list is the normal answer.",
    messages: [
      {
        role: "user",
        content: `# Hard constraints\n${constraints.map((c) => `- ${c}`).join("\n")}\n\n# Recipes\n${summary}`,
      },
    ],
  });
  const parsed = response.parsed_output;
  if (!parsed) return { issues: [] };
  return { issues: parsed.violations.map((v) => `${v.recipe_title}: ${v.constraint} (${v.explanation})`) };
}
