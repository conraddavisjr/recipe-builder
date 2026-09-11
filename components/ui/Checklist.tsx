"use client";

import { useEffect, useState } from "react";

/**
 * Per-browser checklist state keyed by a storage id. Used for the
 * ingredient checkboxes on a recipe and on a group's shopping list, so a
 * half-done shopping trip survives a reload.
 */
export function useChecklist(storageKey: string) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => clearTimeout(t);
  }, [storageKey]);
  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }
  function clear() {
    setChecked(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* storage unavailable */
    }
  }
  return { checked, toggle, clear };
}
