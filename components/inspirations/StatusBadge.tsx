import { LoaderCircle } from "lucide-react";
import type { AnalysisStatus } from "@/lib/types";

const LABEL: Record<AnalysisStatus, string> = {
  pending: "Queued for research",
  running: "Researching",
  done: "Researched",
  stale: "Edited, re-analysis suggested",
  failed: "Research failed",
};

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  const live = status === "pending" || status === "running";
  const color = status === "done" ? "var(--sage)" : status === "failed" ? "var(--accent)" : status === "stale" ? "var(--gold)" : "var(--muted)";
  return (
    <span className="badge" style={{ color, background: "var(--surface-2)" }}>
      {live && <LoaderCircle size={11} className="animate-spin" />}
      {LABEL[status]}
    </span>
  );
}
