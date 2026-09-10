import { describe, expect, it } from "vitest";
import { buildContext, renderContext, renderRequest, type ContextRows } from "./context";
import type { Instruction, Settings } from "@/lib/types";

const settings: Settings = {
  suggestion_count: 5, cadence: "daily", run_hour_utc: 12, autonomous_enabled: false, servings: 2,
  max_cook_minutes: 60, images_per_recipe: 2, ingredient_art_enabled: true, last_run_at: null, updated_at: "2026-09-10T00:00:00Z",
};

const instruction = (over: Partial<Instruction>): Instruction => ({
  id: "x", tier: "preference", body: "", recipe_id: null, active: true,
  created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z", ...over,
});

const rows: ContextRows = {
  settings,
  selections: [
    { category: "cuisine_love", key: "thai", active: true, updated_at: "" },
    { category: "cuisine_love", key: "italian", active: false, updated_at: "" },
    { category: "diet_absolute", key: "nut_free", active: true, updated_at: "" },
  ],
  instructions: [
    instruction({ id: "old", body: "More pasta please", created_at: "2026-08-01T00:00:00Z" }),
    instruction({ id: "new", body: "Actually, fewer carbs", created_at: "2026-09-05T00:00:00Z" }),
    instruction({ id: "t", tier: "truth", body: "Allergic to walnuts", created_at: "2026-07-01T00:00:00Z" }),
    instruction({ id: "muted", body: "Ignored", active: false }),
  ],
  inspirations: [
    {
      id: "i", dish_name: "Khao soi", restaurant_name: "Dee Dee", city: "Austin", notes: "", photo_path: null, photo_url: null,
      analysis: null, user_ingredients: [{ name: "pickled mustard greens", note: "the sour crunch" }],
      analysis_status: "pending", analysis_error: null, analyzed_at: null, created_at: "", updated_at: "",
    },
  ],
  feedback: [{ title: "Green curry", cuisine: "Thai", dish_type: "curry", favorite: true, rating: 5, feedback: "perfect heat", flavor_tags: ["chili_heat"] }],
  recentTitles: ["Green curry"],
};

describe("buildContext", () => {
  const ctx = buildContext(rows);

  it("keeps only active selections and resolves labels", () => {
    expect(ctx.profile.cuisine_love.map((c) => c.label)).toEqual(["Thai"]);
    expect(ctx.profile.diet_absolute[0].label).toBe("Nut free");
  });

  it("orders preferences newest first and drops inactive ones", () => {
    expect(ctx.preferences.map((p) => p.body)).toEqual(["Actually, fewer carbs", "More pasta please"]);
    expect(ctx.truths.map((t) => t.body)).toEqual(["Allergic to walnuts"]);
  });

  it("includes user corrections even without analysis or feedback", () => {
    expect(ctx.inspirations[0].user_corrections[0].name).toBe("pickled mustard greens");
  });

  it("renders deterministically", () => {
    const a = renderContext(ctx);
    const b = renderContext(buildContext(rows));
    expect(a).toBe(b);
    expect(a).toContain("newer overrides older");
    expect(a.indexOf("fewer carbs")).toBeLessThan(a.indexOf("More pasta"));
    expect(a).toContain('"perfect heat"');
  });

  it("renders the generator request with the user's prompt", () => {
    expect(renderRequest({ kind: "generator", prompt: "something brothy" }, 3, 2)).toContain("something brothy");
    expect(renderRequest({ kind: "autonomous" }, 5, 1)).toMatch(/exactly 5 recipes with 1 image prompt each/);
  });
});
