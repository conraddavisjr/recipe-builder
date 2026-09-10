"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useShell } from "./ShellProvider";
import { SettingsForm } from "@/components/settings/SettingsForm";

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useShell();
  const router = useRouter();
  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-[2px]" style={{ background: "var(--backdrop)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSettingsOpen(false)}
        >
          <motion.div
            className="scroll-quiet max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[20px] border border-line bg-bg p-8 shadow-[var(--shadow-dialog)]"
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
                <h2 className="display display-md mt-2">How the kitchen runs</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="mt-5">
              <SettingsForm
                onRunStarted={() => {
                  setSettingsOpen(false);
                  router.push("/");
                  router.refresh();
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
