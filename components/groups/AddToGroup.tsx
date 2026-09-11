"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FolderPlus, LoaderCircle, Plus } from "lucide-react";
import type { GroupRow } from "@/lib/db";
import { api } from "@/lib/client/api";

/**
 * Popover on the recipe page: tick the groups this recipe belongs to, or
 * create a new group inline ("Thanksgiving") and add it in one go.
 */
export function AddToGroup({ recipeId, initialGroupIds }: { recipeId: string; initialGroupIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [member, setMember] = useState<Set<string>>(new Set(initialGroupIds));
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    api<{ groups: GroupRow[] }>("/api/groups").then(({ groups }) => setGroups(groups)).catch(() => setGroups([]));
    const onDown = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle(group: GroupRow) {
    setBusy(group.id);
    try {
      const inGroup = member.has(group.id);
      await api(`/api/groups/${group.id}/recipes`, { method: inGroup ? "DELETE" : "POST", json: { recipe_id: recipeId } });
      setMember((m) => {
        const next = new Set(m);
        if (inGroup) next.delete(group.id);
        else next.add(group.id);
        return next;
      });
    } finally {
      setBusy(null);
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy("new");
    try {
      const { group } = await api<{ group: GroupRow }>("/api/groups", { method: "POST", json: { name: newName.trim() } });
      await api(`/api/groups/${group.id}/recipes`, { method: "POST", json: { recipe_id: recipeId } });
      setGroups((g) => [group, ...(g ?? [])]);
      setMember((m) => new Set(m).add(group.id));
      setNewName("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative" ref={root}>
      <button type="button" className="btn" data-active={member.size > 0} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        <FolderPlus size={15} /> {member.size > 0 ? `In ${member.size} group${member.size === 1 ? "" : "s"}` : "Add to group"}
      </button>
      {open && (
        <div className="card absolute right-0 z-20 mt-2 w-72 p-2 shadow-[var(--shadow-dialog)]" role="dialog" aria-label="Add to group">
          {groups === null ? (
            <p className="px-2 py-3 text-sm text-muted">Loading groups...</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {groups.length === 0 && <li className="px-2 py-2 text-sm text-muted">No groups yet. Create one below.</li>}
              {groups.map((g) => {
                const on = member.has(g.id);
                return (
                  <li key={g.id}>
                    <button type="button" role="checkbox" aria-checked={on} disabled={busy !== null} onClick={() => toggle(g)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-tint">
                      <span className="min-w-0 truncate">{g.name}</span>
                      {busy === g.id ? <LoaderCircle size={14} className="animate-spin text-muted" /> : on ? <Check size={14} /> : <span className="h-3.5 w-3.5 rounded-sm border border-line-strong" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <form onSubmit={createAndAdd} className="mt-2 flex gap-1.5 border-t border-line pt-2">
            <input className="input" placeholder="New group, e.g. Thanksgiving" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={120} aria-label="New group name" />
            <button type="submit" className="btn btn-primary btn-icon shrink-0" aria-label="Create group and add" disabled={busy !== null || !newName.trim()}>
              {busy === "new" ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
