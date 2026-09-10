"use client";

import { createElement } from "react";
import { ingredientIcon } from "@/lib/icons";
import type { Ingredient, IngredientArt } from "@/lib/types";

function formatQuantity(q: number | null, scale: number): string {
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

export function IngredientRow({ ingredient, art, scale }: { ingredient: Ingredient; art?: IngredientArt; scale: number }) {
  const qty = formatQuantity(ingredient.quantity, scale);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
        {art?.url && art.status === "done" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art.url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className={art?.status === "pending" ? "shimmer grid h-full w-full place-items-center" : "text-muted"}>
            {createElement(ingredientIcon(ingredient.ingredient_key), { size: 20, strokeWidth: 1.75, style: { color: "var(--seg-ingredient)" } })}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="font-medium">
          {qty && <span className="tabular-nums" style={{ color: "var(--seg-ingredient)" }}>{qty} {ingredient.unit} </span>}
          {ingredient.name}
        </span>
        {(ingredient.preparation || ingredient.optional) && (
          <span className="block text-xs text-muted">
            {ingredient.preparation}
            {ingredient.optional && (ingredient.preparation ? " · optional" : "optional")}
          </span>
        )}
      </span>
    </li>
  );
}
