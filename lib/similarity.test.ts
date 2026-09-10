import { describe, expect, it } from "vitest";
import { findSimilar, similarity, type SimilarityInput } from "./similarity";

const base: SimilarityInput = {
  id: "a",
  cuisine: "Thai",
  dish_type: "soup",
  presentation: "comfort",
  health_profile: "light_fresh",
  flavor_tags: ["bright_acid", "chili_heat", "coconut_tropical"],
  tags: [],
  ingredients: [{ ingredient_key: "coconut_milk" }, { ingredient_key: "lime" }, { ingredient_key: "chili" }, { ingredient_key: "shrimp" }],
};

describe("similarity", () => {
  it("is 1 for an identical recipe and 0 for an unrelated one", () => {
    expect(similarity(base, { ...base, id: "b" })).toBe(1);
    expect(
      similarity(base, {
        id: "c", cuisine: "French", dish_type: "tart", presentation: "refined", health_profile: "decadent",
        flavor_tags: ["rich_butter"], tags: [], ingredients: [{ ingredient_key: "butter" }],
      }),
    ).toBe(0);
  });

  it("restricts to the requested axes", () => {
    const other: SimilarityInput = { ...base, id: "d", cuisine: "Vietnamese", flavor_tags: [], ingredients: [] };
    expect(similarity(base, other, ["dish_type"])).toBe(1);
    expect(similarity(base, other, ["cuisine"])).toBe(0);
  });

  it("ranks neighbors, excludes self, and applies the floor", () => {
    const library: SimilarityInput[] = [
      base,
      { ...base, id: "close", cuisine: "Thai", dish_type: "curry" },
      { ...base, id: "far", cuisine: "Italian", dish_type: "pasta", flavor_tags: ["tomato_sun"], ingredients: [{ ingredient_key: "pasta" }], presentation: "rustic" },
    ];
    const result = findSimilar(base, library, { minScore: 0.3 });
    expect(result.map((r) => r.recipe.id)).toEqual(["close"]);
  });
});
