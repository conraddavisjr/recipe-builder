import type { SVGProps } from "react";

/**
 * The pregnancy-safe mark: a filled profile silhouette with a rounded belly.
 * Filled rather than stroked on purpose, so it still reads at 13 to 14px
 * inside a badge, where a two-pixel outline collapses into a squiggle.
 */
export function PregnancyIcon({ size = 16, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <circle cx="9.5" cy="4.25" r="3" />
      <path d="M7 8.5h4a1.5 1.5 0 0 1 1.5 1.5v.6a6 6 0 0 1 0 11.4V22a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8.5Z" />
    </svg>
  );
}
