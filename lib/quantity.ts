/** "1", "½", "1¾", "0.33": a scaled quantity as a cook would write it. */
export function formatQuantity(q: number | null, scale: number): string {
  if (q === null) return "";
  const v = q * scale;
  if (Number.isInteger(v)) return String(v);
  const fractions: Array<[number, string]> = [[0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.666, "⅔"], [0.75, "¾"]];
  const whole = Math.floor(v);
  const rest = v - whole;
  const near = fractions.find(([f]) => Math.abs(f - rest) < 0.06);
  if (near) return `${whole || ""}${near[1]}`;
  return v.toFixed(v < 1 ? 2 : 1).replace(/\.?0+$/, "");
}
