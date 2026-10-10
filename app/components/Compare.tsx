"use client";
import type { Result } from "@/lib/types";
import { compareResults, momentumOf, topRival } from "@/lib/insights";
import { Stamp } from "./Stamp";
import { Ruler, crowdColor } from "./ui";

type Side = { idea: string; result: Result };

/** Two ideas, side by side, with a plain-language call on which looks stronger. */
export function Compare({ a, b }: { a: Side; b: Side }) {
  const cmp = compareResults(a.result, b.result);
  const cols = [a, b];
  const winnerIdea = cmp.winner === "a" ? a.idea : cmp.winner === "b" ? b.idea : null;

  return (
    <div>
      <div className="rounded-2xl border border-line bg-sheet p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Head to head</p>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">
          {winnerIdea ? `${winnerIdea} looks stronger` : "Too close to call"}
        </h2>
        {cmp.winner === "tie" ? (
          <p className="mt-2 text-muted">The signals are within a few points of each other. Pick the one you care more about.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {cmp.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {cols.map((c, i) => {
          const rep = c.result.report;
          const mom = momentumOf(c.result);
          const rival = topRival(c.result.apps);
          const win = (cmp.winner === "a" && i === 0) || (cmp.winner === "b" && i === 1);
          return (
            <div key={i} className={`rounded-2xl border bg-sheet p-6 ${win ? "border-brand ring-2 ring-brand/20" : "border-line"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {win && <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">Stronger pick</p>}
                  <h3 className="font-display text-xl font-bold leading-snug">{c.idea}</h3>
                </div>
                {rep && <Stamp verdict={rep.verdict} size={92} />}
              </div>
              {rep ? (
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Crowdedness</dt>
                    <dd className="mt-1 font-display text-2xl font-bold" style={{ color: crowdColor(rep.score) }}>
                      {rep.score}
                      <span className="text-sm font-normal text-muted"> / 100</span>
                    </dd>
                    <Ruler fill={rep.score / 100} color={crowdColor(rep.score)} />
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Demand</dt>
                    <dd className="mt-1 capitalize">
                      {rep.demand?.direction}
                      {mom !== null && <span className="text-muted"> · {mom >= 0 ? "+" : ""}{mom}% over 8 weeks</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Biggest rival</dt>
                    <dd className="mt-1">{rival ? `${rival.title.split(/[:\-–|]/)[0].trim()} (${rival.downloads ?? "?"})` : "None found"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Best gap to own</dt>
                    <dd className="mt-1 leading-relaxed">{rep.gaps?.[0] ?? "n/a"}</dd>
                  </div>
                  <p className="leading-relaxed text-muted">{rep.verdictReason}</p>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted">The AI report failed for this idea. Try again in a minute.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
