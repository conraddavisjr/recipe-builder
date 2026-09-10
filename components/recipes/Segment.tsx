"use client";

import { createElement } from "react";
import { SEGMENT_STYLES, equipmentIcon } from "@/lib/icons";
import type { Step, StepSegment } from "@/lib/types";

/**
 * Two renderings of the same tagged step data.
 *
 * "calm" (default): the sentence reads as prose. Only time and temperature
 * become quiet inline marks (tabular figures with a hair underline in the
 * kind's color), ingredients get a touch more weight, tips go muted. Every
 * tagged span keeps a title tooltip naming its kind, so nothing is lost.
 *
 * "tagged": the original chip-per-segment rendering with a legend, kept
 * behind the "Show tags" toggle for anyone who wants the full annotation.
 */
export type SegmentMode = "calm" | "tagged";

const KIND_LABEL: Record<Exclude<StepSegment["kind"], "text">, string> = {
  ingredient: "Ingredient",
  equipment: "Equipment",
  temperature: "Temperature",
  time: "Time",
  technique: "Technique",
  tip: "Tip",
};

function tooltip(segment: StepSegment): string {
  if (segment.kind === "text") return "";
  const label = KIND_LABEL[segment.kind];
  return segment.value ? `${label}: ${segment.value}` : label;
}

const PUNCT_START = /^[,.;:!?)\]]/;

/**
 * Render a whole step as prose. Spacing is decided here with lookahead: a
 * space follows a segment unless the next one starts with punctuation, so
 * "sake, mirin" never becomes "sake , mirin".
 */
export function StepProse({ segments, mode = "calm" }: { segments: StepSegment[]; mode?: SegmentMode }) {
  return (
    <>
      {segments.map((seg, i) => {
        const next = segments[i + 1];
        const spaceAfter = Boolean(next) && !(next.kind === "text" && PUNCT_START.test(next.text.trimStart())) && !/\s$/.test(seg.text);
        return <Segment key={i} segment={seg} mode={mode} spaceAfter={spaceAfter} />;
      })}
    </>
  );
}

export function Segment({ segment, mode = "calm", spaceAfter = true }: { segment: StepSegment; mode?: SegmentMode; spaceAfter?: boolean }) {
  const trailing = spaceAfter ? " " : "";
  if (segment.kind === "text") return <span>{segment.text.trimStart() === segment.text ? segment.text : segment.text.trimStart()}{trailing}</span>;

  if (mode === "tagged") {
    const style = SEGMENT_STYLES[segment.kind];
    const Icon = style.icon;
    return (
      <>
        <span
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-baseline text-[0.92em] font-medium leading-tight"
          style={{ background: style.bg, color: style.fg }}
          title={tooltip(segment)}
        >
          <Icon size={13} strokeWidth={2.25} aria-label={style.label} />
          {segment.text}
        </span>
        {trailing}
      </>
    );
  }

  switch (segment.kind) {
    case "time":
    case "temperature":
      return (
        <>
          <span
            className="font-semibold tabular-nums underline decoration-[1.5px] underline-offset-[3px]"
            style={{ textDecorationColor: SEGMENT_STYLES[segment.kind].fg }}
            title={tooltip(segment)}
          >
            {segment.text}
          </span>
          {trailing}
        </>
      );
    case "ingredient":
      return (
        <>
          <span className="font-medium" title={tooltip(segment)}>{segment.text}</span>
          {trailing}
        </>
      );
    case "tip":
      return (
        <>
          <span className="text-muted" title={tooltip(segment)}>{segment.text}</span>
          {trailing}
        </>
      );
    default:
      return (
        <>
          <span title={tooltip(segment)}>{segment.text}</span>
          {trailing}
        </>
      );
  }
}

interface Fact {
  kind: "time" | "temperature" | "equipment" | "technique";
  text: string;
}

/**
 * Derive the scannable facts of a step from its segments: one time, one
 * temperature, up to two pieces of equipment, up to two techniques, in that
 * order, deduplicated. Falls back to the step's own duration/temperature
 * fields when the prose carries no tagged value.
 */
export function stepFacts(step: Step): Fact[] {
  const seen = new Set<string>();
  const pick = (kind: Fact["kind"], limit: number): Fact[] => {
    const out: Fact[] = [];
    for (const s of step.segments) {
      if (s.kind !== kind) continue;
      const text = (s.value ?? s.text).trim();
      const key = `${kind}:${text.toLowerCase()}`;
      if (!text || seen.has(key)) continue;
      seen.add(key);
      out.push({ kind, text });
      if (out.length >= limit) break;
    }
    return out;
  };
  const time = pick("time", 1);
  if (time.length === 0 && step.duration_minutes) time.push({ kind: "time", text: `${step.duration_minutes} min` });
  const temperature = pick("temperature", 1);
  if (temperature.length === 0 && step.temperature) temperature.push({ kind: "temperature", text: step.temperature });
  return [...time, ...temperature, ...pick("equipment", 2), ...pick("technique", 2)];
}

/** Quiet monochrome strip under a step title: glyph plus text, no fills. */
export function StepFacts({ step }: { step: Step }) {
  const facts = stepFacts(step);
  if (facts.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-xs" aria-label="Step at a glance">
      {facts.map((f, i) => {
        const icon = f.kind === "equipment" ? equipmentIcon(f.text) : SEGMENT_STYLES[f.kind].icon;
        return (
          <li key={i} className="inline-flex items-center gap-1" title={`${KIND_LABEL[f.kind]}: ${f.text}`}>
            {createElement(icon, { size: 13, strokeWidth: 2, className: "shrink-0 text-muted", "aria-label": KIND_LABEL[f.kind] })}
            <span className="text-ink">{f.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function SegmentLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Step legend">
      {(Object.keys(SEGMENT_STYLES) as Array<keyof typeof SEGMENT_STYLES>).map((kind) => {
        const s = SEGMENT_STYLES[kind];
        const Icon = s.icon;
        return (
          <li key={kind} className="inline-flex items-center gap-1">
            <span className="grid h-5 w-5 place-items-center rounded" style={{ background: s.bg, color: s.fg }}>
              <Icon size={12} strokeWidth={2.25} />
            </span>
            {s.label}
          </li>
        );
      })}
    </ul>
  );
}
