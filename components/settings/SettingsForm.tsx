"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import type { Settings } from "@/lib/types";
import { api } from "@/lib/client/api";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";

/**
 * Settings body. Each control saves on change (PATCH with just that field)
 * so there is no Save button to forget. "Run now" enqueues a manual run and
 * is wired to the queue in chunk 3.
 */
export function SettingsForm({ onRunStarted }: { onRunStarted?: (runId: string) => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api<{ settings: Settings }>("/api/settings")
      .then(({ settings }) => setSettings(settings))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function patch(partial: Partial<Settings>) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...partial });
    setSaving(true);
    setError(null);
    try {
      const { settings: saved } = await api<{ settings: Settings }>("/api/settings", { method: "PATCH", json: partial });
      setSettings(saved);
    } catch (e) {
      setSettings(previous);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setError(null);
    try {
      const { run } = await api<{ run: { id: string } }>("/api/runs", { method: "POST", json: { trigger: "manual" } });
      onRunStarted?.(run.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (error && !settings) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!settings) return <div className="shimmer h-64 rounded-xl" />;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Suggestions per run" hint="How many recipes each autonomous run produces." htmlFor="suggestion_count">
          <input
            id="suggestion_count"
            type="number"
            min={1}
            max={12}
            className="input"
            value={settings.suggestion_count}
            onChange={(e) => patch({ suggestion_count: clamp(Number(e.target.value), 1, 12) })}
          />
        </Field>
        <Field label="Servings" htmlFor="servings">
          <input
            id="servings"
            type="number"
            min={1}
            max={12}
            className="input"
            value={settings.servings}
            onChange={(e) => patch({ servings: clamp(Number(e.target.value), 1, 12) })}
          />
        </Field>
        <Field label="Max cooking time (minutes)" htmlFor="max_cook_minutes">
          <input
            id="max_cook_minutes"
            type="number"
            min={10}
            max={600}
            step={5}
            className="input"
            value={settings.max_cook_minutes}
            onChange={(e) => patch({ max_cook_minutes: clamp(Number(e.target.value), 10, 600) })}
          />
        </Field>
        <Field label="Images per recipe" hint="Distinct views of the finished dish. Each image costs money." htmlFor="images_per_recipe">
          <select
            id="images_per_recipe"
            className="select"
            value={settings.images_per_recipe}
            onChange={(e) => patch({ images_per_recipe: Number(e.target.value) })}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </Field>
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Autonomous runs</p>
            <p className="text-xs text-muted">Generate a fresh batch on a schedule without being asked.</p>
          </div>
          <Toggle
            id="autonomous_enabled"
            label="Autonomous runs"
            checked={settings.autonomous_enabled}
            onChange={(v) => patch({ autonomous_enabled: v })}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Cadence" htmlFor="cadence">
            <select id="cadence" className="select" value={settings.cadence} onChange={(e) => patch({ cadence: e.target.value as Settings["cadence"] })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label="Run at (hour, UTC)" htmlFor="run_hour_utc">
            <input
              id="run_hour_utc"
              type="number"
              min={0}
              max={23}
              className="input"
              value={settings.run_hour_utc}
              onChange={(e) => patch({ run_hour_utc: clamp(Number(e.target.value), 0, 23) })}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">
          Last run: {settings.last_run_at ? new Date(settings.last_run_at).toLocaleString() : "never"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-line p-4">
        <div>
          <p className="font-semibold text-sm">Ingredient illustrations</p>
          <p className="text-xs text-muted">Generate an illustration for each new ingredient (cached forever after).</p>
        </div>
        <Toggle
          id="ingredient_art_enabled"
          label="Ingredient illustrations"
          checked={settings.ingredient_art_enabled}
          onChange={(v) => patch({ ingredient_art_enabled: v })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">
          {saving ? (
            <span className="inline-flex items-center gap-1"><LoaderCircle size={12} className="animate-spin" /> Saving</span>
          ) : error ? (
            <span style={{ color: "var(--accent)" }}>{error}</span>
          ) : (
            "Changes save as you make them."
          )}
        </p>
        <button type="button" className="btn btn-primary" onClick={runNow} disabled={running}>
          {running ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}
          Run now
        </button>
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
