import { config } from "@/lib/config";

/**
 * Fire-and-forget poke of the worker endpoint. Used right after enqueuing
 * work (so a manual run starts within a second) and by the worker itself
 * when its slice ends with work remaining. Failures are logged, not thrown:
 * the pg_cron heartbeat will pick the work up regardless.
 */
export async function kickWorker(): Promise<void> {
  try {
    await fetch(`${config.appOrigin}/api/worker`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.workerSecret}` },
      // Keep the response small; we do not wait for the drain to finish.
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    // A timeout here is expected: the worker keeps running after we stop waiting.
    if (!(err instanceof Error && err.name === "TimeoutError")) {
      console.warn("[worker] kick failed:", err instanceof Error ? err.message : err);
    }
  }
}
