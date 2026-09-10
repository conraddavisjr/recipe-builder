"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ChefHat, ExternalLink, LoaderCircle, Plus, RefreshCw, Search, Trash, X } from "lucide-react";
import type { Inspiration, UserIngredient } from "@/lib/types";
import { api } from "@/lib/client/api";
import { StatusBadge } from "./StatusBadge";

const PROVENANCE: Record<string, { label: string; color: string }> = {
  verified: { label: "Verified", color: "var(--sage)" },
  inferred: { label: "Inferred", color: "var(--gold)" },
  user_provided: { label: "You said so", color: "var(--accent)" },
};

export function InspirationDetail({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Inspiration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<UserIngredient[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  // The poller reads this ref so a refresh never clobbers in-progress edits.
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const live = item?.analysis_status === "pending" || item?.analysis_status === "running";

  useEffect(() => {
    let active = true;
    const load = () =>
      api<{ inspiration: Inspiration }>(`/api/inspirations/${id}`)
        .then(({ inspiration }) => {
          if (!active) return;
          setItem(inspiration);
          setCorrections((c) => (c.length === 0 && !dirtyRef.current ? inspiration.user_ingredients : c));
        })
        .catch((e: Error) => active && setError(e.message));
    const t = setTimeout(load, 0);
    const poll = live ? setInterval(load, 4000) : null;
    return () => {
      active = false;
      clearTimeout(t);
      if (poll) clearInterval(poll);
    };
  }, [id, live]);

  async function saveCorrections() {
    setBusy("save");
    try {
      const { inspiration } = await api<{ inspiration: Inspiration }>(`/api/inspirations/${id}`, {
        method: "PATCH",
        json: { user_ingredients: corrections.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), note: c.note.trim() })) },
      });
      setItem(inspiration);
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function analyze(mode: "research" | "reanalyze") {
    setBusy(mode);
    try {
      if (dirty) await saveCorrections();
      await api(`/api/inspirations/${id}/analyze`, { method: "POST", json: { mode } });
      setItem((i) => (i ? { ...i, analysis_status: "pending" } : i));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function cook() {
    setBusy("cook");
    try {
      await api("/api/runs", { method: "POST", json: { trigger: "inspiration", inspiration_id: id, count: 1 } });
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    try {
      await api(`/api/inspirations/${id}`, { method: "DELETE" });
      router.push("/inspirations");
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  if (error && !item) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!item) return <div className="shimmer h-[60vh] rounded-[var(--radius)]" />;
  const a = item.analysis;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-8">
        <Link href="/inspirations" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> All inspirations</Link>

        <header className="flex flex-wrap items-start gap-5">
          <span className="grid h-40 w-40 shrink-0 place-items-center overflow-hidden rounded-[var(--radius)] bg-surface-2" style={{ boxShadow: "var(--shadow)" }}>
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photo_url} alt={item.dish_name} className="h-full w-full object-cover" />
            ) : (
              <Camera size={24} className="text-muted" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <StatusBadge status={item.analysis_status} />
            <h1 className="display mt-2 text-3xl">{item.dish_name}</h1>
            <p className="text-muted">{[item.restaurant_name, item.city].filter(Boolean).join(" · ")}</p>
            {item.notes && <p className="mt-3 text-sm leading-relaxed">{item.notes}</p>}
            {item.analysis_error && <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>{item.analysis_error}</p>}
          </div>
        </header>

        {a ? (
          <>
            <section className="card space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <span className="badge" style={{ color: a.restaurant_verified ? "var(--sage)" : "var(--gold)" }}>
                  {a.restaurant_verified ? "Restaurant verified" : "Restaurant not verified"}
                </span>
                <span className="badge" style={{ color: a.dish_verified ? "var(--sage)" : "var(--gold)" }}>
                  {a.dish_verified ? "Dish found on the menu" : "Dish not found on a menu"}
                </span>
                {a.cuisine && <span className="badge">{a.cuisine}</span>}
              </div>
              {a.restaurant_summary && <p className="text-sm leading-relaxed">{a.restaurant_summary}</p>}
              {a.menu_description && (
                <blockquote className="border-l-2 pl-3 text-sm italic text-muted" style={{ borderColor: "var(--gold)" }}>{a.menu_description}</blockquote>
              )}
              {a.photo_observations && (
                <p className="text-sm text-muted"><span className="font-semibold text-ink">From the photo: </span>{a.photo_observations}</p>
              )}
              <div className="flex flex-wrap gap-6 text-sm">
                {a.flavor_notes.length > 0 && (
                  <div>
                    <p className="label mb-1">Flavor</p>
                    <div className="flex flex-wrap gap-1.5">{a.flavor_notes.map((f) => <span key={f} className="badge">{f}</span>)}</div>
                  </div>
                )}
                {a.techniques.length > 0 && (
                  <div>
                    <p className="label mb-1">Techniques</p>
                    <div className="flex flex-wrap gap-1.5">{a.techniques.map((t) => <span key={t} className="badge" style={{ background: "var(--seg-technique-bg)", color: "var(--seg-technique)" }}>{t}</span>)}</div>
                  </div>
                )}
              </div>
              {a.caveats && <p className="text-xs text-muted">{a.caveats}</p>}
              {a.sources.length > 0 && (
                <div>
                  <p className="label mb-1">Sources</p>
                  <ul className="space-y-1 text-sm">
                    {a.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
                          {s.title || s.url} <ExternalLink size={12} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <h2 className="display text-xl">What the agent thinks is in it</h2>
              <ul className="mt-3 divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
                {a.ingredients.map((ing, i) => {
                  const p = PROVENANCE[ing.provenance] ?? PROVENANCE.inferred;
                  return (
                    <li key={`${ing.ingredient_key}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{ing.name}</span>
                        {ing.role && <span className="text-muted"> · {ing.role}</span>}
                        {ing.note && <span className="block text-xs text-muted">{ing.note}</span>}
                      </span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2" title={`Confidence ${Math.round(ing.confidence * 100)}%`}>
                        <span className="block h-full" style={{ width: `${Math.round(ing.confidence * 100)}%`, background: p.color }} />
                      </span>
                      <span className="badge" style={{ color: p.color }}>{p.label}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        ) : (
          <div className="card p-6 text-sm text-muted">
            {live ? (
              <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Searching the web for the restaurant and menu{item.photo_path ? " and reading the photo" : ""}...</span>
            ) : (
              "No analysis yet."
            )}
          </div>
        )}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <section className="card p-5">
          <h2 className="display text-xl">Your corrections</h2>
          <p className="mt-1 text-sm text-muted">Fix what the agent got wrong or add what it missed. These are ground truth for every future recipe.</p>
          <ul className="mt-3 space-y-2">
            {corrections.map((c, i) => (
              <li key={i} className="flex gap-2">
                <input className="input" placeholder="Ingredient" value={c.name} onChange={(e) => { setDirty(true); setCorrections((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))); }} />
                <input className="input" placeholder="Note" value={c.note} onChange={(e) => { setDirty(true); setCorrections((cs) => cs.map((x, j) => (j === i ? { ...x, note: e.target.value } : x))); }} />
                <button type="button" className="btn btn-ghost btn-icon shrink-0" aria-label="Remove" onClick={() => { setDirty(true); setCorrections((cs) => cs.filter((_, j) => j !== i)); }}><X size={14} /></button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="btn btn-sm" onClick={() => { setDirty(true); setCorrections((cs) => [...cs, { name: "", note: "" }]); }}><Plus size={14} /> Add ingredient</button>
            <button type="button" className="btn btn-sm btn-primary" disabled={!dirty || busy !== null} onClick={saveCorrections}>
              {busy === "save" ? <LoaderCircle size={14} className="animate-spin" /> : null} Save corrections
            </button>
          </div>
        </section>

        <section className="card space-y-2 p-5">
          <button type="button" className="btn w-full" disabled={busy !== null || live} onClick={() => analyze("reanalyze")}>
            {busy === "reanalyze" ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />} Re-analyze with my corrections
          </button>
          <button type="button" className="btn w-full" disabled={busy !== null || live} onClick={() => analyze("research")}>
            {busy === "research" ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Research again from scratch
          </button>
          <button type="button" className="btn btn-primary w-full" disabled={busy !== null || live} onClick={cook}>
            {busy === "cook" ? <LoaderCircle size={16} className="animate-spin" /> : <ChefHat size={16} />} Cook this at home
          </button>
          <button type="button" className="btn btn-ghost w-full text-muted" disabled={busy !== null} onClick={remove}>
            <Trash size={14} /> Delete inspiration
          </button>
          {error && <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
        </section>
      </aside>
    </div>
  );
}
