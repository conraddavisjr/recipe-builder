"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Ingredient, Step, StepMedia } from "@/lib/types";
import { SegmentLegend, type SegmentMode } from "./Segment";
import { StepItem } from "./StepItem";

interface Props {
  title: string;
  steps: Step[];
  ingredients: Ingredient[];
  scale: number;
  media: StepMedia[];
  mode: SegmentMode;
  onToggleMode: () => void;
  onClose: () => void;
}

/**
 * Cooking view: the method alone, full screen, no nav, no sidebar. Steps
 * flow into two columns whenever the screen is wide enough (an iPad in
 * either orientation), so more of the method is visible at once now that
 * every step can carry a picture. Escape closes it; the screen is asked to
 * stay awake while it is open, where the browser allows.
 */
export function FocusMode({ title, steps, ingredients, scale, media, mode, onToggleMode, onClose }: Props) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    // Keep the screen on while cooking. Best effort: unsupported or denied is fine.
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {});

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      lock?.release().catch(() => {});
    };
  }, [onClose]);

  return (
    <div className="focus-mode" role="dialog" aria-modal="true" aria-label={`Cooking: ${title}`}>
      <header className="focus-mode-bar">
        <p className="display min-w-0 flex-1 truncate text-lg" title={title}>{title}</p>
        <button type="button" className="chip" data-active={mode === "tagged"} aria-pressed={mode === "tagged"} onClick={onToggleMode}>
          Show tags
        </button>
        <button type="button" className="btn btn-ghost btn-icon" aria-label="Exit focus mode" title="Exit focus mode (Esc)" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="focus-mode-body">
        {mode === "tagged" && <div className="mb-6"><SegmentLegend /></div>}
        <ol className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {steps.map((step) => (
            <StepItem key={step.number} step={step} mode={mode} ingredients={ingredients} scale={scale} media={media} />
          ))}
        </ol>
      </div>
    </div>
  );
}
