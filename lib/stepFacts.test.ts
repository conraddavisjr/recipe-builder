import { describe, expect, it } from "vitest";
import { stepFacts } from "@/components/recipes/Segment";
import type { Step } from "@/lib/types";

const step: Step = {
  number: 3,
  title: "Sear the thighs",
  segments: [
    { kind: "text", text: "Lay the" },
    { kind: "ingredient", text: "chicken thighs" },
    { kind: "text", text: "skin side down in the hot" },
    { kind: "equipment", text: "cast iron skillet", value: "cast_iron_skillet" },
    { kind: "text", text: "over" },
    { kind: "temperature", text: "high heat" },
    { kind: "text", text: "and" },
    { kind: "technique", text: "sear", value: "sear" },
    { kind: "text", text: "for" },
    { kind: "time", text: "6 minutes", value: "6 min" },
    { kind: "text", text: ", then flip and" },
    { kind: "technique", text: "sear", value: "sear" },
    { kind: "text", text: "for" },
    { kind: "time", text: "2 minutes", value: "2 min" },
    { kind: "tip", text: "Resist moving them early." },
  ],
};

describe("stepFacts", () => {
  it("orders time, temperature, equipment, technique and dedupes", () => {
    expect(stepFacts(step).map((f) => `${f.kind}:${f.text}`)).toEqual([
      "time:6 min",
      "temperature:high heat",
      "equipment:cast_iron_skillet",
      "technique:sear",
    ]);
  });
  it("falls back to the step's own duration and temperature", () => {
    const bare: Step = { number: 1, title: "Rest", segments: [{ kind: "text", text: "Let it rest." }], duration_minutes: 10, temperature: "room temperature" };
    expect(stepFacts(bare)).toEqual([{ kind: "time", text: "10 min" }, { kind: "temperature", text: "room temperature" }]);
  });
  it("returns nothing for a plain step", () => {
    expect(stepFacts({ number: 1, title: "Serve", segments: [{ kind: "text", text: "Serve." }] })).toEqual([]);
  });
});
