// Pure helpers that turn the raw Google data into readings. No AI involved here.
import type { App, Result, Trend, Verdict } from "./types";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function shortDate(d: string) {
  return d.split(" – ")[0];
}

export function parseDownloads(s?: string): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  const mult: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
  return n * (mult[(m[2] || "").toUpperCase()] ?? 1);
}

export function formatCount(n: number) {
  if (n >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export function parseNewsDate(s?: string): Date | null {
  const m = s?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
}

export function fmtDay(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export type TrendStats = {
  peakIdx: number;
  peak: number;
  peakDate: string;
  recent: number;
  momentum: number; // % change, last 8 weeks vs the 8 before
  spiky: number; // peak divided by the median week
  pctOfPeak: number;
};

export function trendStats(trends: Trend[]): TrendStats | null {
  const v = trends.map((t) => t.value ?? 0);
  const n = v.length;
  if (n < 12) return null;
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  let peakIdx = 0;
  v.forEach((x, i) => {
    if (x > v[peakIdx]) peakIdx = i;
  });
  const recent = avg(v.slice(-4));
  const last8 = avg(v.slice(-8));
  const prev8 = avg(n >= 16 ? v.slice(-16, -8) : v.slice(0, n - 8));
  const momentum = prev8 ? ((last8 - prev8) / prev8) * 100 : 0;
  const sorted = [...v].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  return {
    peakIdx,
    peak: v[peakIdx],
    peakDate: trends[peakIdx].date,
    recent,
    momentum,
    spiky: median > 0 ? v[peakIdx] / median : 1,
    pctOfPeak: v[peakIdx] ? Math.round((recent / v[peakIdx]) * 100) : 0,
  };
}

export type Tone = "good" | "warn" | "bad" | "neutral";
export type Signal = {
  key: string;
  label: string;
  value: string;
  note: string;
  tone: Tone;
  fill: number; // 0..1, drives the small ruler under the value
};

export function buildSignals(r: Result): Signal[] {
  const out: Signal[] = [];
  const st = trendStats(r.trends);

  if (st) {
    const m = Math.round(st.momentum);
    out.push({
      key: "momentum",
      label: "8-week momentum",
      value: `${m >= 0 ? "+" : ""}${m}%`,
      tone: m > 10 ? "good" : m < -10 ? "bad" : "neutral",
      note:
        m > 10
          ? "Searches are climbing compared with the 8 weeks before."
          : m < -10
            ? "Searches are cooling compared with the 8 weeks before."
            : "Searches are steady compared with the 8 weeks before.",
      fill: clamp((m + 50) / 100, 0, 1),
    });
    out.push({
      key: "interest",
      label: "Interest right now",
      value: `${Math.round(st.recent)}/100`,
      tone: "neutral",
      note:
        `${st.pctOfPeak}% of the yearly peak (${shortDate(st.peakDate)}).` +
        (st.spiky >= 1.7 ? " Demand is spiky, so expect a seasonal pattern." : ""),
      fill: clamp(st.recent / 100, 0, 1),
    });
  } else {
    out.push({
      key: "momentum",
      label: "8-week momentum",
      value: "n/a",
      tone: "neutral",
      note: "Google Trends returned too little data for this keyword.",
      fill: 0,
    });
    out.push({
      key: "interest",
      label: "Interest right now",
      value: "n/a",
      tone: "neutral",
      note: "Try a broader description of the idea to get search data.",
      fill: 0,
    });
  }

  const sized = r.apps.map((a) => parseDownloads(a.downloads)).filter((x): x is number => x !== null);
  const heavy = sized.filter((n) => n >= 1e6).length;
  const rated = r.apps.filter((a) => typeof a.rating === "number" && (a.rating as number) > 0);
  const avg = rated.length ? rated.reduce((s, a) => s + (a.rating as number), 0) / rated.length : null;
  out.push({
    key: "incumbents",
    label: "Apps with 1M+ downloads",
    value: `${heavy} of ${r.apps.length}`,
    tone: heavy >= 4 ? "bad" : heavy >= 2 ? "warn" : "good",
    note: avg ? `Average rating ${avg.toFixed(1)} across the apps found.` : "No ratings were found for these apps.",
    fill: r.apps.length ? heavy / r.apps.length : 0,
  });

  const dated = r.news.map((n) => parseNewsDate(n.date)).filter((d): d is Date => d !== null);
  if (dated.length) {
    const ref = r.generatedAt ? new Date(r.generatedAt) : new Date(Math.max(...dated.map((d) => d.getTime())));
    const recent = dated.filter((d) => ref.getTime() - d.getTime() <= 30 * 864e5).length;
    const sources = new Set(r.news.map((n) => n.source).filter(Boolean)).size;
    out.push({
      key: "news",
      label: "Headlines in the last 30 days",
      value: `${recent} of ${r.news.length}`,
      tone: "neutral",
      note: `Coverage comes from ${sources} different sources.`,
      fill: r.news.length ? recent / r.news.length : 0,
    });
  } else {
    out.push({
      key: "news",
      label: "Headlines in the last 30 days",
      value: "n/a",
      tone: "neutral",
      note: "No dated news was found for this topic.",
      fill: 0,
    });
  }

  const companies = new Set(r.jobs.map((j) => j.company).filter(Boolean)).size;
  out.push({
    key: "jobs",
    label: "Job listings found",
    value: String(r.jobs.length),
    tone: "neutral",
    note: r.jobs.length ? `${companies} ${companies === 1 ? "company is" : "companies are"} hiring for this.` : "No listings found for the job keyword.",
    fill: clamp(r.jobs.length / 8, 0, 1),
  });

  return out;
}

export function topRival(apps: App[]): App | null {
  const sized = apps
    .map((a) => ({ a, n: parseDownloads(a.downloads) }))
    .filter((x): x is { a: App; n: number } => x.n !== null)
    .sort((x, y) => y.n - x.n || (y.a.rating ?? 0) - (x.a.rating ?? 0));
  return sized[0]?.a ?? null;
}

export function momentumOf(r: Result): number | null {
  const st = trendStats(r.trends);
  return st ? Math.round(st.momentum) : null;
}

const POINTS: Record<Verdict, number> = { GO: 2, PIVOT: 1, SKIP: 0 };

function composite(r: Result) {
  const rep = r.report;
  if (!rep) return 0;
  const mom = clamp(momentumOf(r) ?? 0, -30, 30);
  const dir = rep.demand?.direction === "rising" ? 8 : rep.demand?.direction === "falling" ? -8 : 0;
  return (100 - rep.score) * 0.5 + POINTS[rep.verdict] * 15 + mom * 0.6 + dir;
}

export function compareResults(a: Result, b: Result) {
  const diff = composite(a) - composite(b);
  if (!a.report || !b.report || Math.abs(diff) < 4) return { winner: "tie" as const, reasons: [] as string[] };
  const aWins = diff > 0;
  const w = aWins ? a : b;
  const l = aWins ? b : a;
  const wr = w.report as NonNullable<Result["report"]>;
  const lr = l.report as NonNullable<Result["report"]>;
  const reasons: string[] = [];
  if (wr.score < lr.score) reasons.push(`Less crowded: ${wr.score} against ${lr.score} out of 100.`);
  if (POINTS[wr.verdict] > POINTS[lr.verdict]) reasons.push(`Better verdict: ${wr.verdict} against ${lr.verdict}.`);
  const mw = momentumOf(w);
  const ml = momentumOf(l);
  if (mw !== null && ml !== null && mw - ml >= 5) {
    reasons.push(`Stronger recent demand: ${mw >= 0 ? "+" : ""}${mw}% against ${ml >= 0 ? "+" : ""}${ml}% over 8 weeks.`);
  }
  if (!reasons.length) reasons.push("It comes out slightly ahead when the signals are combined.");
  return { winner: (aWins ? "a" : "b") as "a" | "b", reasons: reasons.slice(0, 3) };
}

export function serial(idea: string, iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const day = d.toISOString().slice(0, 10);
  const s = idea.toLowerCase().trim() + day;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `PK-${day.replace(/-/g, "")}-${h.toString(36).toUpperCase().slice(0, 4).padStart(4, "0")}`;
}

export function summaryText(idea: string, r: Result) {
  const rep = r.report;
  if (!rep) return idea;
  return `Parakh verdict for "${idea}": ${rep.verdict}. Crowdedness ${rep.score}/100, search demand ${rep.demand?.direction}. Tested on live Google data.`;
}
