import { describe, expect, it } from "vitest";
import { consolidateIngredients } from "./groups";

const ing = (key: string, name: string, quantity: number | null, unit: string, preparation = "", optional = false) => ({
  ingredient_key: key, name, quantity, unit, preparation, optional,
});

describe("consolidateIngredients", () => {
  it("adds quantities for the same ingredient and unit, and remembers the recipes", () => {
    const lines = consolidateIngredients([
      { title: "Stuffing", ingredients: [ing("onion", "Onion", 2, "whole", "diced"), ing("butter", "Butter", 100, "g")] },
      { title: "Gravy", ingredients: [ing("onion", "Onion", 1, "whole", "sliced"), ing("butter", "Butter", 50, "g")] },
    ]);
    const onion = lines.find((l) => l.ingredient_key === "onion")!;
    expect(onion.quantity).toBe(3);
    expect(onion.recipes).toEqual(["Stuffing", "Gravy"]);
    expect(onion.preparations).toEqual(["diced", "sliced"]);
    expect(lines.find((l) => l.ingredient_key === "butter")!.quantity).toBe(150);
  });
  it("keeps different units as separate lines and treats plural units as the same", () => {
    const lines = consolidateIngredients([
      { title: "A", ingredients: [ing("garlic", "Garlic", 3, "cloves")] },
      { title: "B", ingredients: [ing("garlic", "Garlic", 1, "clove"), ing("garlic", "Garlic", 1, "head")] },
    ]);
    expect(lines.filter((l) => l.ingredient_key === "garlic").map((l) => [l.quantity, l.unit])).toEqual([[4, "cloves"], [1, "head"]]);
  });
  it("is optional only when every use is optional", () => {
    const lines = consolidateIngredients([
      { title: "A", ingredients: [ing("chili", "Chili", 1, "whole", "", true)] },
      { title: "B", ingredients: [ing("chili", "Chili", 1, "whole", "", false)] },
    ]);
    expect(lines[0].optional).toBe(false);
  });
});
