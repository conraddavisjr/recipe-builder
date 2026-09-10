import type { GeneratedRecipe } from "@/lib/types";
import type { RecommendationContext } from "./context";

/**
 * Cheap, deterministic constraint checks that run before the model review.
 * They cannot prove a recipe is safe, but they catch the obvious violations
 * (a "vegetarian" profile receiving chicken) without spending tokens.
 */

const MEAT = /\b(beef|steak|pork|bacon|ham|prosciutto|pancetta|lamb|veal|chicken|turkey|duck|sausage|chorizo|salami|pepperoni|brisket|ribs?)\b/i;
const FISH = /\b(fish|salmon|tuna|cod|anchov(y|ies)|sardines?|trout|halibut|snapper|mackerel|fish sauce)\b/i;
const SHELLFISH = /\b(shrimp|prawns?|crab|lobster|scallops?|clams?|mussels?|oysters?|squid|calamari|octopus)\b/i;
const DAIRY = /\b(milk|butter|cream|cheese|yogh?urt|ghee|parmesan|pecorino|feta|mozzarella|ricotta|paneer|whey)\b/i;
const EGG = /\b(eggs?|mayonnaise|aioli)\b/i;
const GLUTEN = /\b(wheat|flour|bread|pasta|noodles?|couscous|barley|rye|seitan|soy sauce|panko|breadcrumbs?)\b/i;
const NUTS = /\b(almonds?|walnuts?|pecans?|cashews?|pistachios?|hazelnuts?|peanuts?|pine nuts?|macadamia|nut butter)\b/i;
const PORK = /\b(pork|bacon|ham|prosciutto|pancetta|chorizo|salami|pepperoni|lard)\b/i;
const BEEF = /\b(beef|steak|brisket|veal|oxtail)\b/i;
const ALCOHOL = /\b(wine|beer|sake|mirin|vermouth|brandy|bourbon|whisk(e)?y|rum|vodka|tequila|liqueur|marsala|sherry)\b/i;

const RULES: Record<string, { pattern: RegExp; label: string }[]> = {
  vegetarian: [{ pattern: MEAT, label: "meat" }, { pattern: FISH, label: "fish" }, { pattern: SHELLFISH, label: "shellfish" }],
  vegan: [
    { pattern: MEAT, label: "meat" }, { pattern: FISH, label: "fish" }, { pattern: SHELLFISH, label: "shellfish" },
    { pattern: DAIRY, label: "dairy" }, { pattern: EGG, label: "egg" }, { pattern: /\bhoney\b/i, label: "honey" },
  ],
  pescatarian: [{ pattern: MEAT, label: "meat" }],
  no_pork: [{ pattern: PORK, label: "pork" }],
  no_beef: [{ pattern: BEEF, label: "beef" }],
  no_shellfish: [{ pattern: SHELLFISH, label: "shellfish" }],
  nut_free: [{ pattern: NUTS, label: "nuts" }],
  dairy_free: [{ pattern: DAIRY, label: "dairy" }],
  gluten_free: [{ pattern: GLUTEN, label: "gluten" }],
  no_alcohol: [{ pattern: ALCOHOL, label: "alcohol" }],
  halal: [{ pattern: PORK, label: "pork" }, { pattern: ALCOHOL, label: "alcohol" }],
  kosher: [{ pattern: PORK, label: "pork" }, { pattern: SHELLFISH, label: "shellfish" }],
};

export interface GuardIssue {
  recipe: string;
  issue: string;
}

export function guardRecipes(recipes: GeneratedRecipe[], ctx: RecommendationContext): GuardIssue[] {
  const issues: GuardIssue[] = [];
  const dietKeys = ctx.profile.diet_absolute.map((d) => d.key);
  const avoidCuisines = ctx.profile.cuisine_avoid.map((c) => c.label.toLowerCase());
  const maxMinutes = ctx.settings.max_cook_minutes;

  for (const r of recipes) {
    const ingredientText = r.ingredients.map((i) => `${i.name} ${i.preparation}`).join(" ");
    for (const key of dietKeys) {
      for (const rule of RULES[key] ?? []) {
        const hit = ingredientText.match(rule.pattern);
        if (hit) issues.push({ recipe: r.title, issue: `contains ${rule.label} ("${hit[0]}") despite ${key}` });
      }
    }
    const cuisine = r.cuisine.toLowerCase();
    for (const avoided of avoidCuisines) {
      const stem = avoided.split(" ")[0];
      if (stem.length > 3 && cuisine.includes(stem)) issues.push({ recipe: r.title, issue: `cuisine "${r.cuisine}" is on the avoid list` });
    }
    if (r.total_minutes > maxMinutes) {
      issues.push({ recipe: r.title, issue: `total time ${r.total_minutes} min exceeds the ${maxMinutes} min limit` });
    }
  }
  return issues;
}
