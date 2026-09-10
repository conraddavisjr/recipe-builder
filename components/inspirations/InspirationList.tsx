"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, MapPin } from "lucide-react";
import type { Inspiration } from "@/lib/types";
import { api } from "@/lib/client/api";
import { InspirationForm } from "./InspirationForm";
import { StatusBadge } from "./StatusBadge";

export function InspirationList() {
  const [items, setItems] = useState<Inspiration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const live = items?.some((i) => i.analysis_status === "pending" || i.analysis_status === "running") ?? false;
  useEffect(() => {
    let active = true;
    const load = () =>
      api<{ inspirations: Inspiration[] }>("/api/inspirations")
        .then(({ inspirations }) => active && setItems(inspirations))
        .catch((e: Error) => active && setError(e.message));
    const t = setTimeout(load, 0);
    const poll = live ? setInterval(load, 4000) : null;
    return () => {
      active = false;
      clearTimeout(t);
      if (poll) clearInterval(poll);
    };
  }, [live]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <InspirationForm onCreated={(i) => setItems((list) => [i, ...(list ?? [])])} />
      </div>
      <div>
        {error && <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
        {items === null ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-24 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="display text-xl">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted">Add the last dish that made you stop talking mid-bite.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id}>
                <Link href={`/inspirations/${i.id}`} className="card card-hover flex gap-4 p-3">
                  <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
                    {i.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Camera size={20} className="text-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-lg leading-tight">{i.dish_name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                      {i.restaurant_name && <span>{i.restaurant_name}</span>}
                      {i.city && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {i.city}</span>}
                    </span>
                    {i.analysis?.cuisine && <span className="mt-1 block text-xs text-muted">{i.analysis.cuisine} · {i.analysis.ingredients.length} ingredients identified</span>}
                    <span className="mt-2 block"><StatusBadge status={i.analysis_status} /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
