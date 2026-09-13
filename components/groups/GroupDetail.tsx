"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, RotateCcw, ShoppingBasket, Trash, X } from "lucide-react";
import type { GroupRow } from "@/lib/db";
import type { ConsolidatedLine } from "@/lib/groups";
import type { RecipeCard as RecipeCardData } from "@/lib/types";
import { api } from "@/lib/client/api";
import { formatQuantity } from "@/components/recipes/IngredientRow";
import { useChecklist } from "@/components/ui/Checklist";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Payload {
  group: GroupRow;
  recipes: RecipeCardData[];
  shopping_list: ConsolidatedLine[];
}

/**
 * A group: its recipes and one consolidated shopping list with checkboxes.
 * Lines merge across recipes when the ingredient and unit match; each line
 * names the recipes that need it.
 */
export function GroupDetail({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { checked, toggle, clear } = useChecklist(`palate.group.${id}`);

  const load = useCallback(() => api<Payload>(`/api/groups/${id}`).then(setData).catch((e: Error) => setError(e.message)), [id]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function removeRecipe(recipeId: string) {
    setBusy(recipeId);
    try {
      await api(`/api/groups/${id}/recipes`, { method: "DELETE", json: { recipe_id: recipeId } });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function addAllToCart() {
    setBusy("cart");
    try {
      const { cart } = await api<{ cart: { id: string } }>("/api/shopping");
      for (const r of data?.recipes ?? []) await api(`/api/shopping/${cart.id}/recipes`, { method: "POST", json: { recipe_id: r.id } });
      router.push("/shop");
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function deleteGroup() {
    setBusy("delete");
    try {
      await api(`/api/groups/${id}`, { method: "DELETE" });
      router.push("/groups");
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
      setConfirm(false);
    }
  }

  if (error && !data) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!data) return <div className="shimmer h-[50vh] rounded-[var(--radius)]" />;
  const { group, recipes, shopping_list } = data;
  const lineId = (l: ConsolidatedLine) => `${l.ingredient_key}|${l.unit}`;
  const done = shopping_list.filter((l) => checked.has(lineId(l))).length;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <Link href="/groups" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> All groups</Link>
        <p className="eyebrow">Group</p>
        <h1 className="display display-lg mt-3">{group.name}</h1>
        {group.description && <p className="lead mt-4">{group.description}</p>}

        <section className="mt-8">
          <h2 className="display display-md">{recipes.length} recipe{recipes.length === 1 ? "" : "s"}</h2>
          {recipes.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing here yet. Open a recipe and choose “Add to group”.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recipes.map((r) => {
                const thumb = r.images.find((i) => i.status === "done" && i.url);
                return (
                  <li key={r.id} className="flex items-center gap-4 py-3">
                    <Link href={`/recipes/${r.id}`} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-tint">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb.url ?? undefined} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </Link>
                    <span className="min-w-0 flex-1">
                      <Link href={`/recipes/${r.id}`} className="display block text-lg leading-snug hover:underline">{r.title}</Link>
                      <span className="text-xs text-muted">{r.cuisine} · {r.active_minutes} min hands-on · {r.total_minutes} total · {r.servings} servings · {r.ingredients.length} ingredients</span>
                    </span>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${r.title} from group`} disabled={busy !== null} onClick={() => removeRecipe(r.id)}>
                      {busy === r.id ? <LoaderCircle size={14} className="animate-spin" /> : <X size={15} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button type="button" className="btn" disabled={busy !== null || recipes.length === 0} onClick={addAllToCart}>
            {busy === "cart" ? <LoaderCircle size={15} className="animate-spin" /> : <ShoppingBasket size={15} />} Add all to shopping
          </button>
          <button type="button" className="btn btn-text text-muted" onClick={() => setConfirm(true)}><Trash size={14} /> Delete this group</button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card section-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Shopping list</p>
              <h2 className="display mt-2 text-2xl">{shopping_list.length} ingredients</h2>
              <p className="mt-1 text-xs text-muted">{done} of {shopping_list.length} checked · quantities combined across recipes</p>
            </div>
            {done > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear}><RotateCcw size={13} /> Reset</button>
            )}
          </div>
          {shopping_list.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Add recipes to build the list.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {shopping_list.map((l) => {
                const lid = lineId(l);
                const on = checked.has(lid);
                const qty = formatQuantity(l.quantity, 1);
                return (
                  <li key={lid}>
                    <label className="flex cursor-pointer items-start gap-3 py-2.5" style={{ opacity: on ? 0.45 : 1 }}>
                      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--olive-deep)]" checked={on} onChange={() => toggle(lid)} aria-label={`Have ${l.name}`} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className={`text-sm font-medium ${on ? "line-through" : ""}`}>
                          {l.name}
                          {(qty || l.unit) && <span className="ml-1.5 text-xs font-normal tabular-nums text-muted">{qty} {l.unit}</span>}
                          {l.optional && <span className="ml-1.5 text-xs font-normal text-muted">optional</span>}
                        </span>
                        <span className="block text-xs text-muted" title={l.preparations.join("; ")}>
                          {l.recipes.length === recipes.length && recipes.length > 1 ? "every recipe" : l.recipes.join(", ")}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <ConfirmDialog
        open={confirm}
        title="Delete this group?"
        body={`“${group.name}” will be removed. The recipes in it stay in your library.`}
        confirmLabel="Delete group"
        busy={busy === "delete"}
        onCancel={() => setConfirm(false)}
        onConfirm={deleteGroup}
      />
    </div>
  );
}
