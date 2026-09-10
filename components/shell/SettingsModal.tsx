"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useShell } from "./ShellProvider";

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useShell();
  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSettingsOpen(false)}
        >
          <motion.div
            className="card w-full max-w-lg p-6"
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Settings"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Settings</p>
                <h2 className="display text-2xl">How the kitchen runs</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm text-muted">Settings form arrives in the next chunk.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
