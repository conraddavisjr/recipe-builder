"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, LoaderCircle, Pencil, RotateCcw, ShoppingBasket, Sparkles, X } from "lucide-react";
import type { ShoppingRun } from "@/lib/db";
import type { ShoppingItem } from "@/lib/shopping";
import { summarize } from "@/lib/shopping";
import { api } from "@/lib/client/api";
import { addedLabel } from "@/lib/client/format";
import { formatQuantity } from "@/components/recipes/IngredientRow";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Payload {
  cart: ShoppingRun;
  history: ShoppingRun[];
}

const STATUS_LABEL: Record<ShoppingRun["status"], string> = {
  gathering: "Open",
  requested: "Waiting for the agent",
  shopping: "The agent is shopping",
  done: "Done",
  failed: "Could not complete",
};

/**
 * The gather cart and the shopping history. "Shop for me" freezes the list
 * and hands it to the agent, which fills the Whole Foods cart and reports
 * per-item results back here.
 */
export function ShopPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(() => api<Payload>("/api/shopping").then((d) => { setData(d); setName((n) => n || d.cart.name); }).catch((e: Error) => setError(e.message)), []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // Poll while a run is being fulfilled.
  const live = data?.history.some((r) => r.status === "requested" || r.status === "shopping") ?? false;
  useEffect(() => {
    if (!live) return;
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [live, load]);

  async function removeRecipe(recipeId: string) {
    if (!data) return;
    setBusy(recipeId);
    try {
      await api(`/api/shopping/${data.cart.id}/recipes`, { method: "DELETE", json: { recipe_id: recipeId } });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function saveName() {
    if (!data) return;
    await api(`/api/shopping/${data.cart.id}`, { method: "PATCH", json: { name: name.trim() } });
  }

  async function toggleStaples() {
    if (!data) return;
    setBusy("staples");
    try {
      await api(`/api/shopping/${data.cart.id}`, { method: "PATCH", json: { skip_staples: !data.cart.skip_staples } });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function shopForMe() {
    if (!data) return;
    setBusy("request");
    try {
      if (name.trim() !== data.cart.name) await saveName();
      await api(`/api/shopping/${data.cart.id}/request`, { method: "POST" });
      setConfirm(false);
      setName("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function shopAgain(runId: string) {
    setBusy(runId);
    try {
      await api(`/api/shopping/${runId}/again`, { method: "POST" });
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(null);
    }
  }

  if (error && !data) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!data) return <div className="shimmer h-[50vh] rounded-[var(--radius)]" />;
  const { cart, history } = data;
  const toBuy = cart.items.filter((i) => i.status === "pending");
  const staples = cart.items.filter((i) => i.staple);

  return (
    <div className="space-y-12">
      {/* Gather cart */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Gathering</p>
              <input
                className="input mt-2 max-w-md"
                placeholder={cart.recipes.length ? "Name this trip (or keep the automatic name)" : "Name this trip"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                aria-label="Shopping trip name"
                maxLength={120}
              />
            </div>
            <button type="button" className="btn btn-primary" disabled={cart.recipes.length === 0 || busy !== null} onClick={() => setConfirm(true)}>
              <Sparkles size={15} /> Shop for me
            </button>
          </div>
          {cart.recipes.length === 0 ? (
            <div className="empty-state mt-6">
              <ShoppingBasket size={28} />
              <p>Your cart is empty. Open any recipe and choose “Add to shopping”, or use “Shop this again” on a past trip below.</p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line">
              {cart.recipes.map((r) => {
                const thumb = r.images.find((i) => i.status === "done" && i.url);
                return (
                  <li key={r.id} className="flex items-center gap-4 py-3">
                    <Link href={`/recipes/${r.id}`} className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-tint">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb.url ?? undefined} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </Link>
                    <span className="min-w-0 flex-1">
                      <Link href={`/recipes/${r.id}`} className="display block text-lg leading-snug hover:underline">{r.title}</Link>
                      <span className="text-xs text-muted">{r.cuisine} · {r.ingredients.length} ingredients</span>
                    </span>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${r.title}`} disabled={busy !== null} onClick={() => removeRecipe(r.id)}>
                      {busy === r.id ? <LoaderCircle size={14} className="animate-spin" /> : <X size={15} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="card section-card lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">Shopping list</p>
          <h2 className="display mt-2 text-2xl">{toBuy.length} to buy</h2>
          <p className="mt-1 text-xs text-muted">Quantities combined across recipes. The agent will match each line to a product.</p>
          {toBuy.length > 0 && (
            <ul className="mt-4 divide-y divide-line text-sm">
              {toBuy.map((l) => <ItemRow key={`${l.ingredient_key}|${l.unit}`} item={l} />)}
            </ul>
          )}
          {staples.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <button type="button" className="flex w-full items-center justify-between text-left text-xs" onClick={toggleStaples} disabled={busy === "staples"}>
                <span className="text-muted">{cart.skip_staples ? `${staples.length} pantry staples assumed on hand` : "Pantry staples included"}</span>
                <span className="font-medium">{cart.skip_staples ? "Include" : "Skip"}</span>
              </button>
              {cart.skip_staples && <p className="mt-1 text-xs text-muted">{staples.map((s) => s.name).join(", ")}</p>}
            </div>
          )}
        </aside>
      </section>

      {/* History */}
      <section>
        <p className="eyebrow">History</p>
        <h2 className="display display-md mt-2">Past trips</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No trips yet. Your first “Shop for me” will appear here with what was added.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((run) => <HistoryRow key={run.id} run={run} onAgain={() => shopAgain(run.id)} onChanged={load} busy={busy === run.id} />)}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title="Shop for me?"
        body={`The agent will add ${toBuy.length} item${toBuy.length === 1 ? "" : "s"} to your Whole Foods cart on Amazon and report back what it found. Nothing is purchased; you review the cart and check out yourself.`}
        confirmLabel="Start shopping"
        busy={busy === "request"}
        onCancel={() => setConfirm(false)}
        onConfirm={shopForMe}
      />
    </div>
  );
}

function ItemRow({ item }: { item: ShoppingItem }) {
  const qty = formatQuantity(item.quantity, 1);
  const color = item.status === "added" ? "var(--olive-deep)" : item.status === "not_found" ? "var(--accent)" : item.status === "skipped" || item.status === "have_it" ? "var(--muted)" : "var(--ink)";
  return (
    <li className="flex items-start gap-2 py-2">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="font-medium">{item.name}</span>
        {(qty || item.unit) && <span className="ml-1.5 text-xs text-muted tabular-nums">{qty} {item.unit}</span>}
        {item.optional && <span className="ml-1.5 text-xs text-muted">optional</span>}
        {item.product && <span className="block text-xs text-muted">→ {item.product}</span>}
        {item.note && <span className="block text-xs text-muted">{item.note}</span>}
      </span>
    </li>
  );
}

function HistoryRow({ run, onAgain, onChanged, busy }: { run: ShoppingRun; onAgain: () => void; onChanged: () => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(run.name);
  const s = summarize(run.items);
  const live = run.status === "requested" || run.status === "shopping";
  async function save() {
    await api(`/api/shopping/${run.id}`, { method: "PATCH", json: { name: name.trim() } });
    setEditing(false);
    onChanged();
  }
  return (
    <li className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: run.status === "done" ? "var(--olive-deep)" : run.status === "failed" ? "var(--accent)" : "var(--gold)" }} aria-hidden />
          <span className="min-w-0 flex-1">
            {editing ? (
              <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus onKeyDown={(e) => e.key === "Enter" && save()} />
                <button type="button" className="btn btn-icon btn-sm" aria-label="Save name" onClick={save}><Check size={14} /></button>
              </span>
            ) : (
              <span className="display block text-lg leading-tight">{run.name || "Untitled trip"}</span>
            )}
            <span className="block text-xs text-muted">
              {STATUS_LABEL[run.status]} · {run.recipes.length} recipe{run.recipes.length === 1 ? "" : "s"} · {addedLabel(run.requested_at ?? run.created_at)}
              {run.status === "done" && ` · ${s.added} added${s.not_found ? `, ${s.not_found} not found` : ""}${s.skipped ? `, ${s.skipped} skipped` : ""}`}
            </span>
          </span>
          {live && <LoaderCircle size={15} className="animate-spin text-muted" />}
          <ChevronDown size={16} className="text-muted transition" style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </button>
        {!editing && (
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Rename" onClick={() => setEditing(true)}><Pencil size={14} /></button>
        )}
        <button type="button" className="btn btn-sm" onClick={onAgain} disabled={busy}>
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />} Shop this again
        </button>
      </div>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <p className="text-xs text-muted">{run.recipes.map((r) => r.title).join(" · ")}</p>
          {run.notes && <p className="mt-2 text-sm">{run.notes}</p>}
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 text-sm">
            {run.items.map((l) => <ItemRow key={`${l.ingredient_key}|${l.unit}`} item={l} />)}
          </ul>
        </div>
      )}
    </li>
  );
}
