"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useShell } from "./ShellProvider";

/**
 * Right-hand drawer for talking to the recommendation agent.
 * The form body is filled in with the instructions feature; this file owns
 * the sliding chrome so every page can open it.
 */
export function InstructionDrawer() {
  const { drawer, closeDrawer } = useShell();
  return (
    <AnimatePresence>
      {drawer.open && (
        <>
          <motion.button
            type="button"
            aria-label="Close drawer"
            className="fixed inset-0 z-40 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-[95vw] flex-col bg-surface shadow-[var(--shadow-lg)]"
            initial={{ x: 460 }}
            animate={{ x: 0 }}
            exit={{ x: 460 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog"
            aria-label="Instructions for the agent"
          >
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <div className="leading-tight">
                <p className="eyebrow">Tell the agent</p>
                <p className="font-semibold text-sm">
                  {drawer.context.recipeTitle ? `About “${drawer.context.recipeTitle}”` : "General guidance"}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={closeDrawer}>
                <X size={18} />
              </button>
            </div>
            <div className="scroll-quiet flex-1 overflow-y-auto p-4">
              <p className="text-sm text-muted">Instruction form arrives in the next chunk.</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
