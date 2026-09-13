import type { Recipe, Step, StepMediaKind } from "@/lib/types";

/**
 * Turn a recipe's steps into explicit visual prompts, one per step.
 *
 * The prose is written for a reader, so it leaves things implicit that a
 * picture cannot: what is already in the pan, that nothing has been taken
 * out, which tool is in hand. Each prompt therefore carries the step's
 * plain sentence plus a running inventory of what previous steps put in
 * the pan, so a "sweat the onion" step is followed by a "bloom the spices"
 * frame that still shows the onion.
 *
 * Deterministic on purpose: it costs nothing and works without the text
 * model. An agent can still hand-write sharper prompts through the import
 * route when a recipe deserves them.
 */

/** Plain sentence of a step, tips left out (they are advice, not action). */
export function stepSentence(step: Step): string {
  const parts: string[] = [];
  for (const seg of step.segments) {
    if (seg.kind === "tip") continue;
    const text = seg.text.trim();
    if (!text) continue;
    const last = parts[parts.length - 1];
    if (last !== undefined && /^[,.;:!?)\]]/.test(text)) parts[parts.length - 1] = last + text;
    else parts.push(text);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Ingredient names mentioned in a step, in order, without duplicates. */
function ingredientsIn(step: Step): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const seg of step.segments) {
    if (seg.kind !== "ingredient") continue;
    const name = seg.text.trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function equipmentIn(step: Step): string | null {
  const seg = step.segments.find((s) => s.kind === "equipment");
  return seg ? seg.text.trim() : null;
}

export interface StoryboardFrame {
  step_number: number;
  prompt: string;
}

export function storyboard(recipe: Pick<Recipe, "title" | "steps">, kind: StepMediaKind, seconds = 8): StoryboardFrame[] {
  const total = recipe.steps.length;
  const inPan: string[] = [];
  let vessel: string | null = null;
  return recipe.steps.map((step) => {
    vessel = equipmentIn(step) ?? vessel;
    const already = inPan.length > 0 ? `Already in the ${vessel ?? "pan"} from earlier steps and still there: ${inPan.join(", ")}. Nothing has been removed.` : "";
    for (const name of ingredientsIn(step)) if (!inPan.includes(name)) inPan.push(name);
    const lines = [
      `${recipe.title}. Step ${step.number} of ${total}: ${step.title}.`,
      stepSentence(step),
      already,
      kind === "video"
        ? `A single continuous ${seconds}-second shot showing this action from start to finish, real-time pace, the cook's hands in frame, no cuts, no text on screen, no narration.`
        : "Show the moment this action is happening, the cook's hands in frame.",
    ].filter(Boolean);
    return { step_number: step.number, prompt: lines.join("\n") };
  });
}
