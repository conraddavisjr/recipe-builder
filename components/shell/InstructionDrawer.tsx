"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import type { Instruction } from "@/lib/types";
import { api } from "@/lib/client/api";
import { useShell } from "./ShellProvider";
import { InstructionComposer } from "@/components/instructions/InstructionComposer";
import { InstructionList } from "@/components/instructions/InstructionList";

/**
 * Right-hand drawer for talking to the recommendation agent. Opens from the
 * top bar (general) or from a recipe card / detail page (with context).
 * Shows the composer plus the five most recent instructions so the user can
 * see what the agent already knows.
 */
export function InstructionDrawer() {
  const { drawer, closeDrawer } = useShell();
  const [recent, setRecent] = useState<Instruction[]>([]);

  useEffect(() => {
    if (!drawer.open) return;
    api<{ instructions: Instruction[] }>("/api/instructions")
      .then(({ instructions }) => setRecent(instructions.slice(0, 5)))
      .catch(() => setRecent([]));
  }, [drawer.open]);

  return (
    <AnimatePresence>
      {drawer.open && (
        <>
          <motion.button
            type="button"
            aria-label="Close drawer"
            className="fixed inset-0 z-40 backdrop-blur-[2px]" style={{ background: "var(--backdrop)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-[490px] max-w-[95vw] flex-col rounded-l-[18px] bg-bg shadow-[var(--shadow-dialog)]"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog"
            aria-label="Instructions for the agent"
          >
            <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-7">
              <div className="min-w-0 leading-tight">
                <p className="eyebrow">Tell the agent</p>
                <p className="truncate font-semibold text-sm">
                  {drawer.context.recipeTitle ? `About “${drawer.context.recipeTitle}”` : "General guidance"}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={closeDrawer}>
                <X size={18} />
              </button>
            </div>
            <div className="scroll-quiet flex-1 space-y-8 overflow-y-auto px-7 py-7">
              <InstructionComposer
                autoFocus
                recipeId={drawer.context.recipeId}
                recipeTitle={drawer.context.recipeTitle}
                onSaved={(ins) => setRecent((r) => [ins, ...r].slice(0, 5))}
              />
              <section>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="display text-lg">What the agent already knows</h3>
                  <Link href="/instructions" onClick={closeDrawer} className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    See all
                  </Link>
                </div>
                <InstructionList instructions={recent} onChange={setRecent} compact />
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
