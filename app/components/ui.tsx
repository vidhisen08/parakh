import type { ReactNode } from "react";

export const TONE_COLOR = {
  good: "#137a43",
  warn: "#a8620a",
  bad: "#b3261e",
  neutral: "#0a5c50",
} as const;

export function crowdColor(score: number) {
  return score < 40 ? TONE_COLOR.good : score < 70 ? TONE_COLOR.warn : TONE_COLOR.bad;
}

export function crowdLabel(score: number) {
  return score < 40 ? "Open market" : score < 70 ? "Contested market" : "Crowded market";
}

/** A ruled scale, like the markings on an assayer's gauge. Every fifth tick is taller. */
export function Ruler({ fill, color, ticks = 25 }: { fill: number; color: string; ticks?: number }) {
  const filled = Math.round(Math.max(0, Math.min(1, fill)) * ticks);
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden="true">
      {Array.from({ length: ticks }).map((_, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{ background: i < filled ? color : "#d9e0e8", height: i % 5 === 4 ? "100%" : "62%" }}
        />
      ))}
    </div>
  );
}

/** Editorial section: the title sits in a left rail and says what the section measures. */
export function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-28 gap-5 border-t border-line py-10 lg:grid-cols-[230px_1fr] lg:gap-12">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted">{hint}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export const pillButton =
  "inline-flex items-center gap-2 rounded-full border border-line bg-sheet px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50";
