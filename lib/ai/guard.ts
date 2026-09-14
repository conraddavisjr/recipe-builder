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
const ALCOHOL = /\b(wine|beer|sake|mirin|vermouth|brandy|bourbon|whisk(e)?y|rum|vodka|tequila|liqueur|marsala|sherry)\b(?!\s*vinegar)/i;
// Pregnancy: the obvious offenders by keyword. The model review pass reads
// the full rule list from the catalog description; this is the cheap net.
// Techniques that always mean an undercooked egg, and dish names that only
// matter when egg is actually among the ingredients (an avocado mousse or a
// meringue-free tiramisu is fine).
const RAW_EGG_TECHNIQUE = /\b(jammy|soft[- ]boiled|runny|sunny[- ]side|poached eggs?|raw eggs?|homemade mayonnaise|aioli|hollandaise)\b/i;
const RAW_EGG_DISH = /\b(carbonara|tiramisu|mousse|meringue|sabayon|zabaglione|custard)\b/i;
const EGG_INGREDIENT = /\b(eggs?|egg yolks?|egg whites?)\b/i;
const RAW_PROTEIN = /\b(sushi|sashimi|crudo|ceviche|tartare|carpaccio|poke|rare steak|blue steak|raw oysters?|oysters? on the half shell)\b/i;
const HIGH_MERCURY = /\b(swordfish|king mackerel|tilefish|shark|marlin|bigeye tuna|orange roughy)\b/i;
const UNPASTEURIZED = /\b(unpasteuri[sz]ed|raw milk|brie|camembert|gorgonzola|roquefort|blue cheese|queso fresco|feta)\b/i;
const CURED_MEAT = /\b(prosciutto|salami|pepperoni|deli meats?|cold cuts|p[aâ]t[eé]|liver|jamon|jamón|bresaola)\b/i;
const SPROUTS = /\b(raw sprouts|alfalfa|bean sprouts?)\b/i;

interface Rule {
  pattern: RegExp;
  label: string;
  /** Only applies when this trigger is present among the ingredients. */
  requires?: RegExp;
  /** Test ingredient lines one by one instead of the whole text (title, steps). */
  scope?: "ingredients";
  /** An ingredient line matching this is exempt ("pasteurized feta"). */
  unless?: RegExp;
}

const PASTEURIZED = /(?<!un)pasteuri[sz]ed/i;

const RULES: Record<string, Rule[]> = {
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
  pregnancy_safe: [
    { pattern: RAW_EGG_TECHNIQUE, label: "raw or undercooked egg" },
    { pattern: RAW_EGG_DISH, label: "raw or undercooked egg", requires: EGG_INGREDIENT },
    { pattern: RAW_PROTEIN, label: "raw or undercooked meat or fish" },
    { pattern: HIGH_MERCURY, label: "high-mercury fish" },
    { pattern: UNPASTEURIZED, label: "unpasteurized or soft cheese", scope: "ingredients", unless: PASTEURIZED },
    { pattern: CURED_MEAT, label: "cured or deli meat" },
    { pattern: SPROUTS, label: "raw sprouts" },
    { pattern: ALCOHOL, label: "alcohol" },
  ],
};

export interface GuardIssue {
  recipe: string;
  issue: string;
}

type Checkable = Pick<GeneratedRecipe, "title" | "ingredients" | "steps">;

/** Every way a recipe breaks the given dietary absolutes, by keyword. */
export function dietIssues(r: Checkable, dietKeys: string[]): Array<{ key: string; label: string; hit: string }> {
  const out: Array<{ key: string; label: string; hit: string }> = [];
  const stepText = r.steps.map((st) => `${st.title} ${st.segments.map((sg) => sg.text).join(" ")}`).join(" ");
  const ingredientLines = r.ingredients.map((i) => `${i.name} ${i.preparation}`);
  const ingredientsOnly = ingredientLines.join(" ");
  const ingredientText = `${ingredientsOnly} ${r.title} ${stepText}`;
  for (const key of dietKeys) {
    for (const rule of RULES[key] ?? []) {
      // A "requires" rule only applies when the trigger ingredient is really present.
      if (rule.requires && !rule.requires.test(ingredientsOnly)) continue;
      if (rule.scope === "ingredients") {
        const line = ingredientLines.find((l) => rule.pattern.test(l) && !(rule.unless && rule.unless.test(l)));
        const hit = line?.match(rule.pattern);
        if (hit) out.push({ key, label: rule.label, hit: hit[0] });
        continue;
      }
      const hit = ingredientText.match(rule.pattern);
      if (hit) out.push({ key, label: rule.label, hit: hit[0] });
    }
  }
  return out;
}

/**
 * Deterministic pregnancy verdict for the badge and the filter. Conservative
 * on purpose: a false "not safe" costs a badge, a false "safe" costs trust.
 */
export function isPregnancySafe(r: Checkable): boolean {
  return dietIssues(r, ["pregnancy_safe"]).length === 0;
}

export function guardRecipes(recipes: GeneratedRecipe[], ctx: RecommendationContext): GuardIssue[] {
  const issues: GuardIssue[] = [];
  const dietKeys = ctx.profile.diet_absolute.map((d) => d.key);
  const avoidCuisines = ctx.profile.cuisine_avoid.map((c) => c.label.toLowerCase());
  const maxMinutes = ctx.settings.max_cook_minutes;

  for (const r of recipes) {
    for (const d of dietIssues(r, dietKeys)) {
      issues.push({ recipe: r.title, issue: `contains ${d.label} ("${d.hit}") despite ${d.key}` });
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
