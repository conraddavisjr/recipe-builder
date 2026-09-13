import { describe, expect, it } from "vitest";
import { autoRunName, buildShoppingItems, isStaple, summarize } from "./shopping";

describe("shopping", () => {
  it("recognizes staples by ingredient key", () => {
    expect(isStaple("sea_salt")).toBe(true);
    expect(isStaple("olive_oil")).toBe(true);
    expect(isStaple("red_wine_vinegar")).toBe(true);
    expect(isStaple("chicken_thigh")).toBe(false);
    expect(isStaple("harissa")).toBe(false);
  });
  it("marks staples as have_it when skipping, pending otherwise", () => {
    const recipes = [{ title: "A", ingredients: [
      { ingredient_key: "sea_salt", name: "Salt", quantity: 1, unit: "tsp", preparation: "", optional: false },
      { ingredient_key: "salmon", name: "Salmon", quantity: 2, unit: "fillets", preparation: "", optional: false },
    ] }];
    expect(buildShoppingItems(recipes, true).map((i) => [i.ingredient_key, i.status])).toEqual([["salmon", "pending"], ["sea_salt", "have_it"]]);
    expect(buildShoppingItems(recipes, false).every((i) => i.status === "pending")).toBe(true);
  });
  it("names runs from the first recipe", () => {
    const d = new Date(2026, 8, 13);
    expect(autoRunName(["Sheet-Pan Harissa Chicken Thighs with Chickpeas", "B", "C"], d)).toBe("Sheet-Pan Harissa Chicken Thighs + 2 more · Sep 13");
    expect(autoRunName([], d)).toBe("Shopping · Sep 13");
  });
  it("summarizes statuses", () => {
    const items = buildShoppingItems([{ title: "A", ingredients: [{ ingredient_key: "sea_salt", name: "Salt", quantity: 1, unit: "tsp", preparation: "", optional: false }] }], true);
    expect(summarize(items).have_it).toBe(1);
  });
});
