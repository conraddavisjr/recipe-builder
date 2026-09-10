import { SEGMENT_STYLES } from "@/lib/icons";
import type { StepSegment } from "@/lib/types";

/**
 * One tagged piece of a step. Plain text renders inline; every other kind
 * gets its glyph and tint so the eye can scan a step for the temperature,
 * the timing or the tool without reading the prose.
 */
export function Segment({ segment }: { segment: StepSegment }) {
  if (segment.kind === "text") return <span>{segment.text} </span>;
  const style = SEGMENT_STYLES[segment.kind];
  const Icon = style.icon;
  return (
    <span
      className="mx-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-baseline text-[0.92em] font-medium leading-tight"
      style={{ background: style.bg, color: style.fg }}
      title={`${style.label}${segment.value ? `: ${segment.value}` : ""}`}
    >
      <Icon size={13} strokeWidth={2.25} aria-label={style.label} />
      {segment.text}
    </span>
  );
}

export function SegmentLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Step legend">
      {(Object.keys(SEGMENT_STYLES) as Array<keyof typeof SEGMENT_STYLES>).map((kind) => {
        const s = SEGMENT_STYLES[kind];
        const Icon = s.icon;
        return (
          <li key={kind} className="inline-flex items-center gap-1">
            <span className="grid h-5 w-5 place-items-center rounded" style={{ background: s.bg, color: s.fg }}>
              <Icon size={12} strokeWidth={2.25} />
            </span>
            {s.label}
          </li>
        );
      })}
    </ul>
  );
}
