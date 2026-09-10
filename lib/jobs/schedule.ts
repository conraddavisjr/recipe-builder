import type { Settings } from "@/lib/types";

/**
 * Decides whether an autonomous run is due. Called by the cron endpoint on
 * every tick, so it must be idempotent: once a run starts, last_run_at moves
 * forward and the same tick cannot fire twice.
 */
export function isRunDue(settings: Pick<Settings, "autonomous_enabled" | "cadence" | "run_hour_utc" | "last_run_at">, now: Date): boolean {
  if (!settings.autonomous_enabled) return false;
  if (now.getUTCHours() < settings.run_hour_utc) return false;
  if (!settings.last_run_at) return true;
  const last = new Date(settings.last_run_at);
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (settings.cadence === "daily") return last.getTime() < dayStart;
  // weekly: at least 6.5 days since the last run, so a slightly early tick still counts
  return now.getTime() - last.getTime() >= 6.5 * 24 * 60 * 60 * 1000;
}
