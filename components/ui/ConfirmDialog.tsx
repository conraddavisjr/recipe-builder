"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, TriangleAlert } from "lucide-react";

/**
 * In-app confirmation for irreversible actions. Escape cancels, the
 * destructive button is the only ink-filled control so the eye lands on
 * the consequence before the click.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center p-4 backdrop-blur-[2px]"
          style={{ background: "var(--backdrop)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            className="w-full max-w-md rounded-[20px] border border-line bg-bg p-7 shadow-[var(--shadow-dialog)]"
            initial={{ y: 12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-body"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "var(--danger-bg)", color: "var(--danger-fg)" }}>
                <TriangleAlert size={17} />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="display text-xl">{title}</h2>
                <p id="confirm-body" className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn" onClick={onCancel} disabled={busy} autoFocus>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
                {busy ? <LoaderCircle size={15} className="animate-spin" /> : null} {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
