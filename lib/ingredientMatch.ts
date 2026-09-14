import type { Ingredient } from "@/lib/types";
import { formatQuantity } from "@/lib/quantity";

/**
 * Find the ingredient a step's tagged phrase refers to, so the tag can show
 * its quantity without a scroll back to the list. Pure string matching,
 * longest match wins: "hot smoked paprika" beats "smoked paprika".
 */

const STOP = /^(the|a|an|of|some|remaining|last|torn|sliced|diced|chopped|drained|crumbled|fresh)\s+/;

function normalize(text: string): string {
  let t = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  let prev = "";
  while (prev !== t) {
    prev = t;
    t = t.replace(STOP, "");
  }
  return t;
}

/** Phrases an ingredient can be referred to by, longest first. */
function aliases(ing: Ingredient): string[] {
  const out = new Set<string>();
  const name = normalize(ing.name);
  if (name) out.add(name);
  for (const part of ing.name.split(/[,(]/)) {
    const p = normalize(part.replace(/\)/g, ""));
    if (p.length >= 3) out.add(p);
  }
  const key = normalize(ing.ingredient_key.replace(/_/g, " "));
  if (key) out.add(key);
  return [...out].sort((a, b) => b.length - a.length);
}

export function ingredientForSegment(text: string, ingredients: Ingredient[]): Ingredient | null {
  const phrase = normalize(text);
  if (!phrase) return null;
  let best: { ing: Ingredient; score: number } | null = null;
  for (const ing of ingredients) {
    for (const alias of aliases(ing)) {
      const hit = phrase === alias || phrase.includes(alias) || alias.includes(phrase);
      if (!hit) continue;
      // Prefer the alias that overlaps the phrase most; ties go to the shorter ingredient name.
      const score = Math.min(alias.length, phrase.length) * 100 - Math.abs(alias.length - phrase.length);
      if (!best || score > best.score) best = { ing, score };
    }
  }
  return best?.ing ?? null;
}

const COUNT_UNITS = new Set(["", "whole", "piece", "pieces", "each"]);

/**
 * Short quantity label for a tag: "1 tsp", "2 cloves", "4", "to taste".
 * Returns null when the phrase already states a quantity ("3 tbsp olive
 * oil"), so the tag never shows two competing numbers.
 */
export function quantityLabel(text: string, ingredients: Ingredient[], scale = 1): string | null {
  if (/^\s*\d/.test(text)) return null;
  const ing = ingredientForSegment(text, ingredients);
  if (!ing) return null;
  if (ing.quantity === null) {
    const prep = ing.preparation.trim();
    return prep && prep.length <= 16 ? prep : null;
  }
  const qty = formatQuantity(ing.quantity, scale);
  const unit = ing.unit.trim();
  return COUNT_UNITS.has(unit) ? qty : `${qty} ${unit}`;
}
