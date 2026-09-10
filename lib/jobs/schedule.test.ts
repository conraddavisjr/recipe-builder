import { describe, expect, it } from "vitest";
import { isRunDue } from "./schedule";

const at = (iso: string) => new Date(iso);

describe("isRunDue", () => {
  it("never fires when autonomous runs are off", () => {
    expect(isRunDue({ autonomous_enabled: false, cadence: "daily", run_hour_utc: 0, last_run_at: null }, at("2026-09-10T12:00:00Z"))).toBe(false);
  });
  it("waits for the configured hour, then fires once per day", () => {
    const s = { autonomous_enabled: true, cadence: "daily" as const, run_hour_utc: 12, last_run_at: null };
    expect(isRunDue(s, at("2026-09-10T11:59:00Z"))).toBe(false);
    expect(isRunDue(s, at("2026-09-10T12:00:00Z"))).toBe(true);
    expect(isRunDue({ ...s, last_run_at: "2026-09-10T12:01:00Z" }, at("2026-09-10T18:00:00Z"))).toBe(false);
    expect(isRunDue({ ...s, last_run_at: "2026-09-10T12:01:00Z" }, at("2026-09-11T12:00:00Z"))).toBe(true);
  });
  it("weekly cadence tolerates a slightly early tick", () => {
    const s = { autonomous_enabled: true, cadence: "weekly" as const, run_hour_utc: 9, last_run_at: "2026-09-03T09:05:00Z" };
    expect(isRunDue(s, at("2026-09-08T10:00:00Z"))).toBe(false);
    expect(isRunDue(s, at("2026-09-10T09:30:00Z"))).toBe(true);
  });
});
