import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, bearerMatches, handle, parseBody } from "@/lib/api";
import { config } from "@/lib/config";
import * as db from "@/lib/db";
import type { ShoppingItem } from "@/lib/shopping";

const Result = z.object({
  ingredient_key: z.string(),
  unit: z.string().optional(),
  status: z.enum(["pending", "working", "added", "attention", "skipped", "not_found", "have_it"]),
  product: z.string().max(300).optional(),
  note: z.string().max(500).optional(),
});
const Input = z.object({
  status: z.enum(["shopping", "done", "failed"]),
  results: z.array(Result).optional(),
  notes: z.string().max(4000).optional(),
});

/**
 * POST /api/shopping/:id/complete (Bearer WORKER_SECRET)
 * The fulfilling agent reports progress incrementally: status "shopping"
 * with one or more item results as it goes (mark an item "working" before
 * searching, then its outcome), then "done" or "failed". Results merge into
 * the frozen list, so the page can show live per-item progress.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!bearerMatches(request, config.workerSecret)) return apiError("Unauthorized", 401);
  return handle(async () => {
    const { id } = await ctx.params;
    const parsed = await parseBody(request, Input);
    if ("response" in parsed) return parsed.response;
    const run = await db.getShoppingRun(id);
    if (!run) return apiError("Shopping run not found", 404);
    const { status, results = [], notes } = parsed.data;
    const items: ShoppingItem[] = run.items.map((item) => {
      const r = results.find((x) => x.ingredient_key === item.ingredient_key && (x.unit === undefined || x.unit === item.unit));
      return r ? { ...item, status: r.status, product: r.product ?? item.product, note: r.note ?? item.note } : item;
    });
    const updated = await db.updateShoppingRun(id, {
      status,
      items,
      notes: notes ?? run.notes,
      completed_at: status === "done" || status === "failed" ? new Date().toISOString() : run.completed_at,
    });
    return NextResponse.json({ run: updated });
  });
}
