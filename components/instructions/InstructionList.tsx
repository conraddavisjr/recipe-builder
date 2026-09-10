"use client";

import { useState } from "react";
import { Pencil, ShieldCheck, Sparkles, Trash, Check, X } from "lucide-react";
import type { Instruction } from "@/lib/types";
import { api } from "@/lib/client/api";

/**
 * Renders instructions newest first, truths visually distinct from
 * preferences. Supports inline edit, toggle active, and delete.
 */
export function InstructionList({
  instructions,
  onChange,
  compact,
}: {
  instructions: Instruction[];
  onChange: (next: Instruction[]) => void;
  compact?: boolean;
}) {
  if (instructions.length === 0) {
    return <p className="text-sm text-muted">Nothing yet. The agent only knows your profile so far.</p>;
  }
  return (
    <ul className="space-y-2">
      {instructions.map((ins) => (
        <InstructionRow
          key={ins.id}
          instruction={ins}
          compact={compact}
          onUpdated={(updated) => onChange(instructions.map((i) => (i.id === updated.id ? updated : i)))}
          onDeleted={() => onChange(instructions.filter((i) => i.id !== ins.id))}
        />
      ))}
    </ul>
  );
}

function InstructionRow({
  instruction,
  compact,
  onUpdated,
  onDeleted,
}: {
  instruction: Instruction;
  compact?: boolean;
  onUpdated: (i: Instruction) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(instruction.body);
  const [busy, setBusy] = useState(false);
  const truth = instruction.tier === "truth";

  async function save() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const { instruction: updated } = await api<{ instruction: Instruction }>(`/api/instructions/${instruction.id}`, {
        method: "PATCH",
        json: { body: draft.trim() },
      });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    try {
      const { instruction: updated } = await api<{ instruction: Instruction }>(`/api/instructions/${instruction.id}`, {
        method: "PATCH",
        json: { active: !instruction.active },
      });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/instructions/${instruction.id}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className="group rounded-[var(--radius-md)] border border-line bg-surface p-4"
      style={{ opacity: instruction.active ? 1 : 0.5 }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: truth ? "var(--ink)" : "var(--tint-active)", color: truth ? "var(--accent-ink)" : "var(--olive-deep)" }}
          title={truth ? "Absolute truth" : "Preference"}
        >
          {truth ? <ShieldCheck size={15} /> : <Sparkles size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <textarea className="textarea" value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} style={{ minHeight: "4.5rem" }} />
          ) : (
            <p className="text-sm leading-relaxed">{instruction.body}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {truth ? "Absolute truth" : "Preference"} · {new Date(instruction.created_at).toLocaleString()}
            {instruction.recipe_id && !compact && " · said while viewing a recipe"}
            {!instruction.active && " · inactive"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          {editing ? (
            <>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Save" onClick={save} disabled={busy}><Check size={16} /></button>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Cancel" onClick={() => { setEditing(false); setDraft(instruction.body); }}><X size={16} /></button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Edit" onClick={() => setEditing(true)} disabled={busy}><Pencil size={15} /></button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={toggleActive} disabled={busy}>
                {instruction.active ? "Mute" : "Unmute"}
              </button>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Delete" onClick={remove} disabled={busy}><Trash size={15} /></button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
