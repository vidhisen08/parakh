"use client";
import type { Result } from "@/lib/types";
import { fmtDay, momentumOf, serial, topRival } from "@/lib/insights";
import { Stamp, verdictMeta } from "./Stamp";
import { Ruler, TONE_COLOR, crowdColor, crowdLabel } from "./ui";

/** The result header, laid out like an assay certificate. */
export function Certificate({ idea, result, animate = true }: { idea: string; result: Result; animate?: boolean }) {
  const rep = result.report;
  if (!rep) return null;
  const m = verdictMeta(rep.verdict);
  const when = result.generatedAt ? new Date(result.generatedAt) : new Date();
  const rival = topRival(result.apps);
  const mom = momentumOf(result);
  const dir = rep.demand?.direction;
  const dirColor = dir === "rising" ? TONE_COLOR.good : dir === "falling" ? TONE_COLOR.bad : TONE_COLOR.neutral;
  const understood = result.keywords?.understood;

  return (
    <div className="print-keep relative overflow-hidden rounded-2xl border border-line bg-sheet shadow-[0_1px_0_rgba(15,27,45,.04),0_18px_40px_-24px_rgba(15,27,45,.25)]">
      <div className="guilloche absolute inset-0" aria-hidden="true" />
      <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <span>Assay certificate</span>
            <span className="font-mono normal-case tracking-normal">{serial(idea, result.generatedAt)}</span>
            <span className="normal-case tracking-normal font-medium">{fmtDay(when)}</span>
            {result.fromSnapshot && (
              <span className="rounded-full bg-brand-tint px-2 py-0.5 normal-case tracking-normal text-brand">
                Saved example
              </span>
            )}
          </div>
          <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {idea}
          </h2>
          {understood && understood.trim().toLowerCase() !== idea.trim().toLowerCase() && (
            <p className="mt-2 text-sm text-muted">
              Parakh read this as: <span className="font-medium text-ink">{understood}</span>
            </p>
          )}
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed">{rep.verdictReason}</p>

          <dl className="mt-7 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Crowdedness</dt>
              <dd className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold" style={{ color: crowdColor(rep.score) }}>
                  {rep.score}
                </span>
                <span className="text-sm text-muted">/ 100 · {crowdLabel(rep.score)}</span>
              </dd>
              <div className="mt-2">
                <Ruler fill={rep.score / 100} color={crowdColor(rep.score)} />
              </div>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Search demand</dt>
              <dd className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold capitalize" style={{ color: dirColor }}>
                  {dir ?? "n/a"}
                </span>
              </dd>
              <p className="mt-1 text-sm text-muted">
                {mom === null ? "Not enough trend data." : `${mom >= 0 ? "+" : ""}${mom}% over the last 8 weeks`}
              </p>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Biggest rival</dt>
              <dd className="font-display mt-1 truncate text-xl font-bold">{rival ? rival.title.split(/[:\-–|]/)[0].trim() : "None found"}</dd>
              <p className="mt-1 text-sm text-muted">
                {rival ? `${rival.downloads ?? "?"} downloads · rated ${rival.rating ?? "?"}` : "No sized apps in the results."}
              </p>
            </div>
          </dl>
        </div>
        <div className="flex items-start justify-center lg:justify-end">
          <Stamp verdict={rep.verdict} size={188} animate={animate} />
        </div>
      </div>
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper/60 px-6 py-3 text-xs text-muted sm:px-9">
        <span>
          Based on {result.trends.length} weeks of Trends, {result.apps.length} apps, {result.news.length} headlines and{" "}
          {result.jobs.length} job listings.
        </span>
        <span style={{ color: m.color }} className="font-semibold">
          {m.word} · {m.line}
        </span>
      </div>
    </div>
  );
}
