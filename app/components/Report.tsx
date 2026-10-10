"use client";
import { useEffect, useState } from "react";
import type { Result } from "@/lib/types";
import { buildSignals, fmtDay, parseNewsDate } from "@/lib/insights";
import { Landscape, TrendChart } from "./Charts";
import { Ruler, Section, TONE_COLOR } from "./ui";

const STRENGTH: Record<string, { label: string; color: string }> = {
  strong: { label: "Strong evidence", color: TONE_COLOR.good },
  medium: { label: "Some evidence", color: TONE_COLOR.warn },
  weak: { label: "Thin evidence", color: TONE_COLOR.bad },
};

function useChecklist(key: string, n: number) {
  const [done, setDone] = useState<boolean[]>(() => Array(n).fill(false));
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(`parakh:check:${key}`);
        const arr = raw ? (JSON.parse(raw) as boolean[]) : null;
        setDone(Array.from({ length: n }, (_, i) => Boolean(arr?.[i])));
      } catch {
        setDone(Array(n).fill(false));
      }
    }, 0);
    return () => clearTimeout(t);
  }, [key, n]);
  function toggle(i: number) {
    setDone((d) => {
      const next = d.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(`parakh:check:${key}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  return { done, toggle };
}

export function Report({ idea, result, checkKey }: { idea: string; result: Result; checkKey: string }) {
  const rep = result.report;
  const steps = rep?.nextSteps ?? [];
  const { done, toggle } = useChecklist(checkKey, steps.length);
  if (!rep) return null;
  const signals = buildSignals(result);
  const finished = done.filter(Boolean).length;
  const kw = result.keywords;

  return (
    <div>
      <Section id="signals" title="Signal check" hint="Five readings taken straight from Google data. No AI opinion in this part.">
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {signals.map((s) => (
            <div key={s.key} className="print-keep bg-sheet p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="font-display mt-1 text-3xl font-bold" style={{ color: TONE_COLOR[s.tone] }}>
                {s.value}
              </p>
              <div className="mt-2">
                <Ruler fill={s.fill} color={TONE_COLOR[s.tone]} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.note}</p>
            </div>
          ))}
          <div className="print-keep bg-sheet p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Why this crowdedness score</p>
            <p className="mt-2 text-sm leading-relaxed">{rep.scoreReason}</p>
          </div>
        </div>
      </Section>

      <Section id="demand" title="Demand" hint="Weekly Google search interest over the last 12 months, 100 being the busiest week.">
        <div className="rounded-xl border border-line bg-sheet p-4 sm:p-6">
          <TrendChart data={result.trends} />
          <p className="mt-3 text-sm leading-relaxed">{rep.demand?.note}</p>
          {result.keywords?.trends && (
            <p className="mt-2 text-xs text-muted">
              Keyword searched: <span className="font-mono">{result.keywords.trends}</span>
            </p>
          )}
        </div>
        {result.related?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display text-lg font-bold">What people also search</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {result.related.slice(0, 10).map((r) => (
                <li key={r.query} className="rounded-full border border-line bg-sheet px-3 py-1.5 text-sm">
                  {r.query}
                  <span className="ml-2 text-xs font-semibold text-brand">{String(r.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="competitors" title="Competitors" hint="Apps people already use for this, and where they let users down. Each claim shows its evidence.">
        <div className="rounded-xl border border-line bg-sheet p-4 sm:p-6">
          <Landscape apps={result.apps} />
        </div>
        <ul className="mt-6 grid gap-4">
          {rep.competitors?.map((c) => {
            const s = STRENGTH[c.evidenceStrength ?? "medium"];
            return (
              <li key={c.name} className="print-keep rounded-xl border border-line bg-sheet p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl font-bold">{c.name}</h3>
                  <span className="text-sm text-muted">Rated {c.rating || "n/a"}</span>
                </div>
                <p className="mt-2 leading-relaxed">{c.weakness}</p>
                <p className="mt-3 border-l-2 border-line pl-3 text-sm italic leading-relaxed text-muted">{c.evidence}</p>
                <p className="mt-3 text-xs font-semibold" style={{ color: s.color }}>
                  {s.label}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="opportunities" title="Opportunities" hint="Gaps you could own, then a checklist for the next week. Ticks are saved on this device.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {rep.gaps?.map((g, i) => (
            <li key={i} className="print-keep rounded-xl border border-line bg-brand-tint p-5 text-[15px] leading-relaxed">
              <span className="font-display mr-2 text-brand">{String(i + 1).padStart(2, "0")}</span>
              {g}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold">Next steps</h3>
            <span className="text-sm text-muted">
              {finished} of {steps.length} done
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-sheet">
            {steps.map((s, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 p-4">
                  <input
                    type="checkbox"
                    checked={done[i] ?? false}
                    onChange={() => toggle(i)}
                    className="mt-1 h-4 w-4 accent-[#0a5c50]"
                  />
                  <span className={done[i] ? "text-muted line-through" : ""}>{s}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="voice" title="Market voice" hint="What the news is saying and who is hiring around this idea.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-bold">In the news</h3>
            {rep.newsSignals?.length ? (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
                {rep.newsSignals.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-sheet">
              {result.news.slice(0, 6).map((n) => {
                const d = parseNewsDate(n.date);
                return (
                  <li key={n.link} className="p-3.5">
                    <a href={n.link} target="_blank" rel="noreferrer" className="font-medium leading-snug underline-offset-2 hover:underline">
                      {n.title}
                    </a>
                    <p className="mt-1 text-xs text-muted">
                      {n.source}
                      {d ? ` · ${fmtDay(d)}` : ""}
                    </p>
                  </li>
                );
              })}
              {!result.news.length && <li className="p-3.5 text-sm text-muted">No news found.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Hiring</h3>
            {rep.hiring && <p className="mt-2 text-[15px] leading-relaxed">{rep.hiring}</p>}
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-sheet">
              {result.jobs.slice(0, 6).map((j, i) => (
                <li key={i} className="p-3.5">
                  <p className="font-medium leading-snug">{j.title}</p>
                  <p className="mt-1 text-xs text-muted">{[j.company, j.location].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
              {!result.jobs.length && <li className="p-3.5 text-sm text-muted">No job listings found.</li>}
            </ul>
          </div>
        </div>
      </Section>

      <Section id="sources" title="Sources and method" hint="Exactly what Parakh searched, so you can check the work yourself.">
        <div className="overflow-x-auto rounded-xl border border-line bg-sheet">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3 font-semibold">SerpApi engine</th>
                <th className="p-3 font-semibold">Keyword</th>
                <th className="p-3 font-semibold">Results</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Google Trends", kw?.trends, `${result.trends.length} weeks`],
                ["Trends related queries", kw?.trends, `${result.related.length} queries`],
                ["Google Play", kw?.play, `${result.apps.length} apps`],
                ["Google News", kw?.news, `${result.news.length} headlines`],
                ["Google Jobs", kw?.jobs, `${result.jobs.length} listings`],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <td className="p-3 font-medium">{a}</td>
                  <td className="p-3 font-mono text-xs">{b ?? "n/a"}</td>
                  <td className="p-3">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The verdict and written analysis come from Gemini reading this data. The numbers and charts above are computed
          directly from the Google results for &ldquo;{idea}&rdquo;.
        </p>
        {result.apps.length > 0 && (
          <details className="mt-4 rounded-xl border border-line bg-sheet p-4 text-sm">
            <summary className="cursor-pointer font-semibold">All {result.apps.length} apps found</summary>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {result.apps.map((a) => (
                <li key={a.link}>
                  <a href={a.link} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                    {a.title}
                  </a>
                  <span className="text-muted">
                    {" "}
                    · {a.rating ?? "?"} · {a.downloads ?? "?"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Section>
    </div>
  );
}
