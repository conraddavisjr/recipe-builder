"use client";

import type { Ingredient, Step, StepMedia } from "@/lib/types";
import { StepFacts, StepProse, type SegmentMode } from "./Segment";
import { StepMediaFigure, pickStepMedia } from "./StepMedia";

interface Props {
  step: Step;
  mode: SegmentMode;
  ingredients: Ingredient[];
  scale: number;
  media: StepMedia[];
  className?: string;
}

/**
 * One method step: numeral, title, the calm facts strip, the prose (tagged
 * with quantities when asked), and its still or clip. Shared by the detail
 * page list and focus mode so the two never drift apart.
 */
export function StepItem({ step, mode, ingredients, scale, media, className = "" }: Props) {
  const figure = pickStepMedia(media, step.number);
  return (
    <li className={`flex gap-5 ${className}`}>
      <span className="display step-number">{String(step.number).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <h3 className="display text-xl">{step.title}</h3>
        {mode === "calm" && <StepFacts step={step} />}
        <p className={`mt-3 text-[15px] ${mode === "tagged" ? "leading-[1.9]" : "leading-[1.7]"}`}>
          <StepProse segments={step.segments} mode={mode} ingredients={ingredients} scale={scale} />
        </p>
        {figure && <StepMediaFigure media={figure} title={step.title} />}
      </div>
    </li>
  );
}
