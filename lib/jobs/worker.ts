import { config } from "@/lib/config";
import * as db from "@/lib/db";
import { HANDLERS, settleRunIfDone } from "./handlers";

export interface DrainReport {
  processed: number;
  failed: number;
  remaining: number;
  elapsed_ms: number;
}

/**
 * Drain the queue one task at a time until the time slice is used up or the
 * queue is empty. Sequential on purpose: image APIs rate-limit per minute
 * and a single long generation call is the common case.
 */
export async function drain(sliceMs = config.workerSliceMs): Promise<DrainReport> {
  const started = Date.now();
  let processed = 0;
  let failed = 0;
  // Leave headroom so the slowest task (a generation call) is not started
  // with only seconds left in the function's lifetime.
  const softDeadline = started + sliceMs;

  while (Date.now() < softDeadline) {
    const [task] = await db.claimTasks(1);
    if (!task) break;
    let settled = false;
    try {
      await HANDLERS[task.type](task);
      await db.completeTask(task.id);
      processed++;
      settled = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[worker] task ${task.type} ${task.id} attempt ${task.attempts}: ${message}`);
      const outcome = await db.failTask(task, message);
      if (outcome === "failed") {
        failed++;
        settled = true;
      }
    }
    if (settled && task.run_id) await settleRunIfDone(task.run_id);
  }

  // Self-heal: any run still "rendering" with no open tasks (for example
  // after a crashed slice) is closed out here.
  for (const runId of await db.listRenderingRunIds()) await settleRunIfDone(runId);

  return { processed, failed, remaining: await db.countQueuedTasks(), elapsed_ms: Date.now() - started };
}
