"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pic } from "@/components/ui/Pic";
import { FolderOpen, LoaderCircle, Plus } from "lucide-react";
import type { GroupRow } from "@/lib/db";
import { api } from "@/lib/client/api";
import { addedLabel } from "@/lib/client/format";

export function GroupList() {
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ groups: GroupRow[] }>("/api/groups").then(({ groups }) => setGroups(groups)).catch((e: Error) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { group } = await api<{ group: GroupRow }>("/api/groups", { method: "POST", json: { name: name.trim(), description: description.trim() } });
      setGroups((g) => [group, ...(g ?? [])]);
      setName("");
      setDescription("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_1fr]">
      <form onSubmit={create} className="card h-fit space-y-4 p-7 lg:sticky lg:top-24">
        <div>
          <p className="eyebrow">New group</p>
          <h2 className="display display-md mt-2">Gather a few dishes</h2>
          <p className="mt-1 text-sm text-muted">A holiday table, a week of lunches, the dinner party. Every group gets one consolidated shopping list.</p>
        </div>
        <input className="input" placeholder="Group name, e.g. Thanksgiving" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required aria-label="Group name" />
        <textarea className="textarea" placeholder="Notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} style={{ minHeight: "4.5rem" }} aria-label="Group notes" />
        {error && <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} Create group
          </button>
        </div>
      </form>
      <div>
        {groups === null ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-[var(--radius)]" />)}</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={28} />
            <p>No groups yet. Open any recipe and use “Add to group”, or create one here.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link href={`/groups/${g.id}`} className="card card-hover flex gap-4 p-4">
                  <span className="grid h-24 w-24 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-xl bg-tint">
                    {g.covers.length === 0 ? (
                      <span className="col-span-2 grid place-items-center text-muted"><FolderOpen size={20} /></span>
                    ) : (
                      g.covers.map((url, i) => (
                        <Pic key={i} src={url} sizes="thumb" className={`h-full w-full object-cover ${g.covers.length === 1 ? "col-span-2" : ""}`} />
                      ))
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-xl leading-tight">{g.name}</span>
                    {g.description && <span className="mt-1 line-clamp-2 block text-sm text-muted">{g.description}</span>}
                    <span className="mt-2 block text-xs text-muted">{g.recipe_count} recipe{g.recipe_count === 1 ? "" : "s"} · created {addedLabel(g.created_at)}</span>
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
