import { describe, expect, it } from "vitest";
import { guardRecipes } from "./guard";
import type { RecommendationContext } from "./context";
import type { GeneratedRecipe } from "@/lib/types";

const ctx = (dietKeys: string[]): RecommendationContext => ({
  settings: { suggestion_count: 3, servings: 2, max_cook_minutes: 90, images_per_recipe: 1 },
  profile: {
    cuisine_love: [], cuisine_avoid: [], flavor: [], presentation: [], health: [], cookware: [],
    diet_absolute: dietKeys.map((key) => ({ key, label: key, description: "" })),
  },
  truths: [], preferences: [], inspirations: [], feedback: [], recent_titles: [],
});

const recipe = (over: Partial<GeneratedRecipe>): GeneratedRecipe => ({
  title: "Test", summary_poetic: "", rationale: "", cuisine: "Test", dish_type: "bowl", health_profile: "balanced",
  presentation: "comfort", tags: [], flavor_tags: [], servings: 2, active_minutes: 10, total_minutes: 20, difficulty: "easy",
  ingredients: [], equipment: [], steps: [{ number: 1, title: "Cook", segments: [{ kind: "text", text: "Cook it." }] }], image_prompts: ["x"], ...over,
});

describe("guardRecipes pregnancy_safe", () => {
  it("flags undercooked eggs even when they only appear in a step", () => {
    const r = recipe({
      title: "Eggplant yam",
      ingredients: [{ ingredient_key: "egg", name: "Eggs", quantity: 2, unit: "whole", preparation: "", optional: false }],
      steps: [{ number: 1, title: "Eggs", segments: [{ kind: "technique", text: "boil to jammy" }] }],
    });
    expect(guardRecipes([r], ctx(["pregnancy_safe"])).map((i) => i.issue)).toEqual([expect.stringContaining("raw or undercooked egg")]);
  });
  it("flags high-mercury fish and cured meats, passes a cooked chicken dish", () => {
    const sword = recipe({ title: "Charcoal swordfish", ingredients: [{ ingredient_key: "swordfish", name: "Swordfish steaks", quantity: 2, unit: "whole", preparation: "", optional: false }] });
    const ham = recipe({ title: "Board", ingredients: [{ ingredient_key: "prosciutto", name: "Prosciutto", quantity: 4, unit: "slices", preparation: "", optional: false }] });
    const ok = recipe({ title: "Braised chicken thighs", ingredients: [{ ingredient_key: "chicken_thigh", name: "Chicken thighs", quantity: 4, unit: "whole", preparation: "bone-in", optional: false }] });
    const issues = guardRecipes([sword, ham, ok], ctx(["pregnancy_safe"]));
    expect(issues.map((i) => i.recipe)).toEqual(["Charcoal swordfish", "Board"]);
  });
  it("does not flag an egg-free mousse, but does flag a mousse that contains egg", () => {
    const eggFree = recipe({ title: "Avocado cacao mousse", ingredients: [{ ingredient_key: "avocado", name: "Avocado", quantity: 2, unit: "whole", preparation: "", optional: false }] });
    const eggy = recipe({ title: "Chocolate mousse", ingredients: [{ ingredient_key: "egg", name: "Egg whites", quantity: 3, unit: "whole", preparation: "", optional: false }] });
    expect(guardRecipes([eggFree, eggy], ctx(["pregnancy_safe"])).map((i) => i.recipe)).toEqual(["Chocolate mousse"]);
  });
  it("treats wine vinegar as vinegar, not alcohol", () => {
    const ok = recipe({ ingredients: [{ ingredient_key: "red_wine_vinegar", name: "Red wine vinegar", quantity: 2, unit: "tbsp", preparation: "", optional: false }] });
    const bad = recipe({ title: "Braise", ingredients: [{ ingredient_key: "red_wine", name: "Red wine", quantity: 200, unit: "ml", preparation: "", optional: false }] });
    expect(guardRecipes([ok, bad], ctx(["no_alcohol"])).map((i) => i.recipe)).toEqual(["Braise"]);
  });
  it("does nothing when the absolute is not selected", () => {
    const r = recipe({ ingredients: [{ ingredient_key: "swordfish", name: "Swordfish", quantity: 1, unit: "whole", preparation: "", optional: false }] });
    expect(guardRecipes([r], ctx([]))).toEqual([]);
  });
});
