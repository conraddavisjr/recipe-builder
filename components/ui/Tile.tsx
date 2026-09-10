"use client";

import { Check } from "lucide-react";
import { CatalogIcon } from "@/lib/icons";
import type { CatalogItem } from "@/lib/catalog";

/**
 * Illustrated, toggleable preference card. Used by every wizard step and the
 * revisit view; clicking flips the selection. `cue` is an optional second
 * line (flavor profiles use it for the sensory description).
 */
export function Tile({
  item,
  active,
  cue,
  onToggle,
  busy,
}: {
  item: CatalogItem;
  active: boolean;
  cue?: string;
  onToggle: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      className="tile"
      data-active={active}
      aria-pressed={active}
      disabled={busy}
      onClick={onToggle}
      style={{ "--hue": item.hue } as React.CSSProperties}
    >
      <span className="flex items-start justify-between">
        <span className="tile-art">
          <CatalogIcon name={item.icon} size={24} strokeWidth={1.75} />
        </span>
        <span
          className="grid h-6 w-6 place-items-center rounded-full border transition"
          style={{
            borderColor: active ? "var(--tile-fg)" : "var(--line)",
            background: active ? "var(--tile-fg)" : "transparent",
            color: "var(--tile-bg)",
          }}
          aria-hidden
        >
          {active && <Check size={14} strokeWidth={3} />}
        </span>
      </span>
      <span className="font-semibold leading-tight">{item.label}</span>
      {cue && <span className="text-xs font-medium" style={{ color: "var(--tile-fg)" }}>{cue}</span>}
      <span className="text-xs leading-snug text-muted">{item.description}</span>
    </button>
  );
}
