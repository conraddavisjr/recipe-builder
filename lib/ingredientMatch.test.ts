import { describe, expect, it } from "vitest";
import { ingredientForSegment, quantityLabel } from "./ingredientMatch";
import type { Ingredient } from "@/lib/types";

const ing = (name: string, key: string, quantity: number | null, unit: string, preparation = ""): Ingredient => ({
  name, ingredient_key: key, quantity, unit, preparation, optional: false,
});

const list: Ingredient[] = [
  ing("Pimenton de la Vera, sweet smoked paprika", "smoked_paprika", 2, "tsp"),
  ing("Hot smoked paprika", "hot_smoked_paprika", 0.5, "tsp"),
  ing("Ground cumin", "cumin", 1, "tsp"),
  ing("Garlic", "garlic", 4, "cloves", "thinly sliced"),
  ing("Eggs", "egg", 4, "whole"),
  ing("Extra virgin olive oil", "olive_oil", 4, "tbsp"),
  ing("Sea salt", "salt", null, "", "to taste"),
  ing("Yellow onion", "onion", 1, "medium", "finely diced"),
];

describe("ingredientForSegment", () => {
  it("prefers the longest matching alias", () => {
    expect(ingredientForSegment("hot smoked paprika", list)?.ingredient_key).toBe("hot_smoked_paprika");
    expect(ingredientForSegment("sweet smoked paprika", list)?.ingredient_key).toBe("smoked_paprika");
  });
  it("matches through descriptive words and the key", () => {
    expect(ingredientForSegment("the sliced garlic", list)?.ingredient_key).toBe("garlic");
    expect(ingredientForSegment("egg", list)?.ingredient_key).toBe("egg");
    expect(ingredientForSegment("ground cumin", list)?.ingredient_key).toBe("cumin");
  });
  it("returns null for phrases that are not ingredients", () => {
    expect(ingredientForSegment("wooden spoon", list)).toBeNull();
  });
});

describe("quantityLabel", () => {
  it("formats count units without the unit word and others with it", () => {
    expect(quantityLabel("egg", list)).toBe("4");
    expect(quantityLabel("ground cumin", list)).toBe("1 tsp");
    expect(quantityLabel("garlic", list)).toBe("4 cloves");
    expect(quantityLabel("onion", list)).toBe("1 medium");
  });
  it("scales with the serving multiplier", () => {
    expect(quantityLabel("hot smoked paprika", list, 2)).toBe("1 tsp");
    expect(quantityLabel("ground cumin", list, 0.5)).toBe("½ tsp");
  });
  it("shows the preparation when there is no quantity", () => {
    expect(quantityLabel("salt", list)).toBe("to taste");
  });
  it("stays quiet when the phrase already carries a quantity", () => {
    expect(quantityLabel("3 tbsp olive oil", list)).toBeNull();
  });
});
