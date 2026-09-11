"use client";

import { createElement } from "react";
import { ingredientIcon } from "@/lib/icons";
import type { Ingredient, IngredientArt } from "@/lib/types";

export function formatQuantity(q: number | null, scale: number): string {
  if (q === null) return "";
  const v = q * scale;
  if (Number.isInteger(v)) return String(v);
  const fractions: Array<[number, string]> = [[0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.666, "⅔"], [0.75, "¾"]];
  const whole = Math.floor(v);
  const rest = v - whole;
  const near = fractions.find(([f]) => Math.abs(f - rest) < 0.06);
  if (near) return `${whole || ""}${near[1]}`;
  return v.toFixed(v < 1 ? 2 : 1).replace(/\.?0+$/, "");
}

/**
 * One ingredient line with a checkbox (have it / got it), the illustration
 * or a glyph while it renders, and the scaled quantity in muted text.
 */
export function IngredientRow({
  ingredient,
  art,
  scale,
  checked,
  onToggle,
}: {
  ingredient: Ingredient;
  art?: IngredientArt;
  scale: number;
  checked?: boolean;
  onToggle?: () => void;
}) {
  const qty = formatQuantity(ingredient.quantity, scale);
  return (
    <li className="border-b border-line last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <label className="flex cursor-pointer items-center gap-3 py-2.5" style={{ opacity: checked ? 0.45 : 1 }}>
        {onToggle && (
          <input type="checkbox" className="h-4 w-4 shrink-0 accent-[var(--olive-deep)]" checked={Boolean(checked)} onChange={onToggle} aria-label={`Have ${ingredient.name}`} />
        )}
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
          {art?.url && art.status === "done" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art.url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className={art?.status === "pending" ? "shimmer grid h-full w-full place-items-center" : "text-muted"}>
              {createElement(ingredientIcon(ingredient.ingredient_key), { size: 18, strokeWidth: 1.75, className: "text-muted" })}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className={`font-medium ${checked ? "line-through" : ""}`}>
            {ingredient.name}
            {qty && <span className="ml-1.5 text-xs font-normal tabular-nums text-muted">{qty} {ingredient.unit}</span>}
          </span>
          {(ingredient.preparation || ingredient.optional) && (
            <span className="block text-xs text-muted">
              {ingredient.preparation}
              {ingredient.optional && (ingredient.preparation ? " · optional" : "optional")}
            </span>
          )}
        </span>
      </label>
    </li>
  );
}
