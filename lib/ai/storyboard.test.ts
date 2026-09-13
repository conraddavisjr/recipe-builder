import { describe, expect, it } from "vitest";
import { stepSentence, storyboard } from "./storyboard";
import type { Step } from "@/lib/types";

const steps: Step[] = [
  {
    number: 1,
    title: "Sweat the alliums",
    segments: [
      { kind: "text", text: "Warm" },
      { kind: "ingredient", text: "olive oil" },
      { kind: "text", text: "in the" },
      { kind: "equipment", text: "cast iron skillet" },
      { kind: "text", text: ", add the" },
      { kind: "ingredient", text: "onion" },
      { kind: "text", text: "and" },
      { kind: "technique", text: "sweat" },
      { kind: "text", text: "for" },
      { kind: "time", text: "8 minutes", value: "8 min" },
      { kind: "text", text: "." },
      { kind: "tip", text: "Do not brown it." },
    ],
  },
  {
    number: 2,
    title: "Bloom the pimenton",
    segments: [
      { kind: "text", text: "Off the heat, stir in the" },
      { kind: "ingredient", text: "smoked paprika" },
      { kind: "text", text: "." },
    ],
  },
];

describe("stepSentence", () => {
  it("joins segments into prose without spaces before punctuation and without tips", () => {
    expect(stepSentence(steps[0])).toBe("Warm olive oil in the cast iron skillet, add the onion and sweat for 8 minutes.");
  });
});

describe("storyboard", () => {
  it("carries what earlier steps put in the pan into later frames", () => {
    const frames = storyboard({ title: "Test dish", steps }, "image");
    expect(frames).toHaveLength(2);
    expect(frames[0].prompt).not.toContain("Already in");
    expect(frames[1].prompt).toContain("Already in the cast iron skillet from earlier steps and still there: olive oil, onion. Nothing has been removed.");
  });

  it("phrases video frames as one continuous shot of the given length", () => {
    const [frame] = storyboard({ title: "Test dish", steps }, "video", 12);
    expect(frame.prompt).toContain("12-second shot");
    expect(frame.prompt).toContain("no text on screen");
  });
});
