"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clapperboard, Image as ImageIcon, LoaderCircle } from "lucide-react";
import type { StepMedia, StepMediaKind } from "@/lib/types";

/**
 * Visuals for the method: one still or one short clip per step, shown
 * under the step's prose. A clip wins over a still for the same step once
 * it exists, so upgrading from a storyboard to video replaces frames in
 * place without a second row of pictures.
 */

export function pickStepMedia(all: StepMedia[], stepNumber: number): StepMedia | null {
  const mine = all.filter((m) => m.step_number === stepNumber);
  const done = (kind: StepMediaKind) => mine.find((m) => m.kind === kind && m.status === "done" && m.url);
  const pending = (kind: StepMediaKind) => mine.find((m) => m.kind === kind && m.status === "pending");
  return done("video") ?? pending("video") ?? done("image") ?? pending("image") ?? mine.find((m) => m.status === "failed") ?? null;
}

export function StepMediaFigure({ media, title }: { media: StepMedia; title: string }) {
  if (media.status === "failed") {
    return <p className="mt-3 text-xs text-muted">Could not illustrate this step{media.error ? `: ${media.error}` : "."}</p>;
  }
  if (media.status === "pending" || !media.url) {
    return (
      <div className="step-media step-media-pending mt-4" role="status" aria-live="polite">
        <LoaderCircle size={16} className="animate-spin" />
        <span>{media.kind === "video" ? "Filming this step..." : "Illustrating this step..."}</span>
      </div>
    );
  }
  if (media.kind === "video") {
    return (
      <figure className="step-media mt-4">
        <video src={media.url} poster={media.poster_url ?? undefined} controls muted loop playsInline preload="metadata" aria-label={`Step ${media.step_number}: ${title}`} />
      </figure>
    );
  }
  return (
    <figure className="step-media mt-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt={`Step ${media.step_number}: ${title}`} loading="lazy" />
    </figure>
  );
}

interface ControlsProps {
  media: StepMedia[];
  busy: boolean;
  onIllustrate: (kind: StepMediaKind) => void;
}

/** "Illustrate steps" menu: stills now, clips when you want motion. */
export function StepMediaControls({ media, busy, onIllustrate }: ControlsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasStills = media.some((m) => m.kind === "image" && m.status === "done");
  const hasClips = media.some((m) => m.kind === "video" && m.status === "done");
  const pending = media.some((m) => m.status === "pending");

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(kind: StepMediaKind) {
    setOpen(false);
    onIllustrate(kind);
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" className="chip" aria-haspopup="menu" aria-expanded={open} disabled={busy || pending} onClick={() => setOpen((o) => !o)} title="Generate a picture or a short clip for every step">
        {busy || pending ? <LoaderCircle size={13} className="animate-spin" /> : <Clapperboard size={13} />}
        {pending ? "Illustrating..." : "Illustrate steps"}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div role="menu" className="popover right-0 mt-2 w-64">
          <button type="button" role="menuitem" className="popover-item" onClick={() => choose("image")}>
            <ImageIcon size={14} className="text-muted" />
            <span>
              <span className="block text-sm">{hasStills ? "Redraw the stills" : "Stills, one per step"}</span>
              <span className="block text-xs text-muted">Under a dollar, about a minute</span>
            </span>
          </button>
          <button type="button" role="menuitem" className="popover-item" onClick={() => choose("video")}>
            <Clapperboard size={14} className="text-muted" />
            <span>
              <span className="block text-sm">{hasClips ? "Refilm the clips" : "Short clips, one per step"}</span>
              <span className="block text-xs text-muted">Roughly a dollar per step, a few minutes</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
