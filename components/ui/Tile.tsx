"use client";

import { Check } from "lucide-react";
import { CatalogIcon } from "@/lib/icons";
import type { CatalogItem } from "@/lib/catalog";

/**
 * Illustrated, toggleable preference card. Inactive tiles are neutral so
 * selection is the only color on the grid; the hue paints the active state.
 * `compact` drops the description for steps whose labels speak for
 * themselves (cuisines to avoid, cookware).
 */
export function Tile({
  item,
  active,
  cue,
  onToggle,
  busy,
  compact,
}: {
  item: CatalogItem;
  active: boolean;
  cue?: string;
  onToggle: () => void;
  busy?: boolean;
  compact?: boolean;
}) {
  const secondary = cue ?? item.description;
  return (
    <button
      type="button"
      className={`tile${compact ? " tile-compact" : ""}`}
      data-active={active}
      aria-pressed={active}
      disabled={busy}
      onClick={onToggle}
      title={item.description}
      style={{ "--hue": item.hue } as React.CSSProperties}
    >
      {active && (
        <span className="tile-check" aria-hidden>
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      <span className="tile-art">
        <CatalogIcon name={item.icon} size={compact ? 18 : 22} strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className={`display block leading-tight ${compact ? "text-base" : "text-lg"}`}>{item.label}</span>
        {!compact && <span className="tile-desc mt-1 block text-xs leading-snug text-muted">{secondary}</span>}
      </span>
    </button>
  );
}
