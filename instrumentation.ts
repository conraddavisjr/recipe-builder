/**
 * Local heartbeat for the task queue.
 *
 * In production a Supabase pg_cron job calls POST /api/worker every minute so
 * queued work is always picked up. There is no such thing on a laptop, so in
 * development the server process pokes its own worker on an interval. The
 * worker is idempotent and cheap when the queue is empty.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV === "production") return;
  if (process.env.LOCAL_WORKER_HEARTBEAT === "0") return;

  const { kickWorker } = await import("@/lib/jobs/trigger");
  const every = 30_000;
  // Delay the first tick so the dev server finishes booting.
  setTimeout(() => {
    void kickWorker();
    setInterval(() => void kickWorker(), every).unref();
  }, 10_000).unref();
}
