"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { Run } from "@/lib/types";
import { api } from "@/lib/client/api";

/**
 * Small pill in the top bar while any run is live, on every page, so
 * leaving the generator never feels like abandoning it.
 */
export function CookingIndicator() {
  const [run, setRun] = useState<Run | null>(null);
  useEffect(() => {
    let active = true;
    const check = () =>
      api<{ runs: Run[] }>("/api/runs")
        .then(({ runs }) => active && setRun(runs.find((r) => r.status === "queued" || r.status === "generating" || r.status === "rendering") ?? null))
        .catch(() => undefined);
    const t = setTimeout(check, 0);
    const poll = setInterval(check, 8000);
    return () => {
      active = false;
      clearTimeout(t);
      clearInterval(poll);
    };
  }, []);
  if (!run) return null;
  const label = run.status === "rendering" ? `Photographing ${run.progress.done}/${run.progress.total}` : run.status === "generating" ? "Composing recipes" : "Queued";
  return (
    <Link href={run.trigger === "generator" ? "/generator" : "/history"} className="chip hidden md:inline-flex" title="A run is in progress. Click for details.">
      <LoaderCircle size={13} className="animate-spin" style={{ color: "var(--accent)" }} /> {label}
    </Link>
  );
}
