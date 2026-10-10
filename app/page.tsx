"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang, Result } from "@/lib/types";
import { EXAMPLES, isExample, snapshotName } from "@/lib/examples";
import { summaryText } from "@/lib/insights";
import { Certificate } from "./components/Certificate";
import { Report } from "./components/Report";
import { Logo } from "./components/Logo";
import { Compare } from "./components/Compare";
import { verdictMeta } from "./components/Stamp";
import { pillButton } from "./components/ui";

type Mode = "test" | "compare" | "history";
type HistoryItem = { idea: string; lang: Lang; verdict: string; score: number; at: string };

const NAV = [
  ["signals", "Signals"],
  ["demand", "Demand"],
  ["competitors", "Competitors"],
  ["opportunities", "Opportunities"],
  ["voice", "Market voice"],
  ["sources", "Sources"],
];

async function fetchResult(
  idea: string,
  lang: Lang,
  opts: { live?: boolean; onStep?: (s: string) => void } = {},
): Promise<Result> {
  if (isExample(idea) && !opts.live) {
    try {
      const r = await fetch(`/demos/${snapshotName(idea, lang)}.json`);
      if (r.ok) return { ...((await r.json()) as Result), fromSnapshot: true };
    } catch {}
  }
  const res = await fetch(`/api/research?idea=${encodeURIComponent(idea)}&lang=${lang}`);
  if (!res.ok || !res.body) throw new Error("The server could not be reached. Please try again.");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.type === "step") opts.onStep?.(msg.text);
      else if (msg.type === "error") throw new Error(msg.message);
      else if (msg.type === "done") return msg.data as Result;
    }
  }
  throw new Error("The connection closed early. Please try again.");
}

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem("parakh:history") || "[]");
  } catch {
    return [];
  }
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("test");
  const [lang, setLang] = useState<Lang>("en");
  const [idea, setIdea] = useState("");
  const [ideaB, setIdeaB] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [shown, setShown] = useState<{ idea: string; result: Result } | null>(null);
  const [pair, setPair] = useState<{ a: { idea: string; result: Result }; b: { idea: string; result: Result } } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const remember = useCallback((i: string, l: Lang, r: Result) => {
    if (!r.report) return;
    const item: HistoryItem = { idea: i, lang: l, verdict: r.report.verdict, score: r.report.score, at: new Date().toISOString() };
    setHistory((h) => {
      const next = [item, ...h.filter((x) => !(x.idea === i && x.lang === l))].slice(0, 12);
      try {
        localStorage.setItem("parakh:history", JSON.stringify(next));
        localStorage.setItem("parakh:last", i);
      } catch {}
      return next;
    });
  }, []);

  const run = useCallback(
    async (text: string, l: Lang, live = false) => {
      const t = text.trim();
      if (t.length < 4 || busy) return;
      setMode("test");
      setIdea(t);
      setBusy(true);
      setError("");
      setLog([]);
      setShown(null);
      try {
        const r = await fetchResult(t, l, { live, onStep: (s) => setLog((x) => [...x, s]) });
        setShown({ idea: t, result: r });
        remember(t, l, r);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
    },
    [busy, remember],
  );

  async function runCompare() {
    const a = idea.trim();
    const b = ideaB.trim();
    if (a.length < 4 || b.length < 4 || busy) return;
    setBusy(true);
    setError("");
    setPair(null);
    setLog([]);
    try {
      const ra = await fetchResult(a, lang, { onStep: (s) => setLog((x) => [...x, `A: ${s}`]) });
      const rb = await fetchResult(b, lang, { onStep: (s) => setLog((x) => [...x, `B: ${s}`]) });
      remember(a, lang, ra);
      remember(b, lang, rb);
      setPair({ a: { idea: a, result: ra }, b: { idea: b, result: rb } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Restore history, and auto-run when the page is opened with ?idea=...
  useEffect(() => {
    const t = setTimeout(() => {
      setHistory(loadHistory());
      const q = new URLSearchParams(window.location.search);
      const i = q.get("idea");
      const l: Lang = q.get("lang") === "hi" ? "hi" : "en";
      if (i) {
        setLang(l);
        void run(i, l);
      } else {
        try {
          const last = localStorage.getItem("parakh:last");
          if (last) setIdea(last);
        } catch {}
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rep = shown?.result.report;
  const shareUrl = () =>
    shown ? `${window.location.origin}/?idea=${encodeURIComponent(shown.idea)}&lang=${lang}` : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-sheet px-4 py-3.5 text-base outline-none placeholder:text-muted/70 focus:border-brand";

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-sheet/85 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-brand via-go to-pivot" aria-hidden="true" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Parakh home">
            <Logo size={34} />
            <span className="leading-tight">
              <span className="font-display block text-xl font-extrabold sm:text-2xl tracking-tight text-brand">
                Parakh <span className="hidden text-base font-semibold text-muted sm:inline">परख</span>
              </span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:block">
                Startup idea assay
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="Mode">
            <div className="flex rounded-full border border-line bg-paper p-1">
              {(["test", "compare", "history"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded-full px-2.5 py-1.5 text-[13px] font-medium capitalize transition-colors sm:px-4 sm:text-sm ${mode === m ? "bg-brand text-white shadow-sm" : "text-muted hover:text-ink"}`}
                >
                  {m}
                  {m === "history" && history.length > 0 && (
                    <span className={`ml-1.5 hidden rounded-full sm:inline px-1.5 text-xs ${mode === m ? "bg-white/20" : "bg-line"}`}>{history.length}</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="ml-1 rounded-full border border-line bg-sheet px-3 py-2 sm:ml-2 sm:px-3.5 font-medium hover:border-brand"
              aria-label="Switch report language"
            >
              <span className="sm:hidden">{lang === "en" ? "हि" : "EN"}</span>
              <span className="hidden sm:inline">{lang === "en" ? "हिन्दी" : "English"}</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="no-print pt-12 pb-8 sm:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Startup idea assay</p>
          <h1 className="font-display mt-3 max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Is your startup idea worth building? Check it against live Google data.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Parakh reads search demand, competing apps, news and job listings through SerpApi, then gives you a verdict
            with the evidence behind it.
          </p>

          {mode === "history" ? (
            <div className="mt-8">
              {history.length === 0 ? (
                <p className="text-muted">Nothing here yet. Test an idea and it will be saved on this device.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {history.map((h) => {
                    const m = verdictMeta(h.verdict);
                    return (
                      <li key={h.idea + h.lang}>
                        <button
                          onClick={() => {
                            setLang(h.lang);
                            void run(h.idea, h.lang);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-sheet p-4 text-left hover:border-brand"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{h.idea}</span>
                            <span className="text-xs text-muted">
                              Crowdedness {h.score}/100 · {new Date(h.at).toLocaleDateString("en-IN")}
                            </span>
                          </span>
                          <span className="font-display text-lg font-extrabold" style={{ color: m.color }}>
                            {m.word}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <form
              className="mt-8 max-w-3xl"
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "compare") void runCompare();
                else void run(idea, lang);
              }}
            >
              <label htmlFor="idea" className="sr-only">
                Your startup idea
              </label>
              <div className={mode === "compare" ? "grid gap-3 sm:grid-cols-2" : "flex flex-col gap-3 sm:flex-row"}>
                <input
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder={mode === "compare" ? "Idea A" : "e.g. AI tutor for JEE students"}
                  className={inputCls}
                  maxLength={160}
                />
                {mode === "compare" && (
                  <input
                    value={ideaB}
                    onChange={(e) => setIdeaB(e.target.value)}
                    placeholder="Idea B"
                    aria-label="Second idea"
                    className={inputCls}
                    maxLength={160}
                  />
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-brand px-7 py-3.5 font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
                >
                  {busy ? "Testing…" : mode === "compare" ? "Compare" : "Test idea"}
                </button>
              </div>
              {mode === "compare" && (
                <p className="mt-3 rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-deep">
                  Comparing runs two full searches, which uses about 10 of your SerpApi searches unless the ideas were tested before.
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">Try:</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (mode === "compare") {
                        if (!idea.trim() || idea === ex) setIdea(ex);
                        else setIdeaB(ex);
                      } else void run(ex, lang);
                    }}
                    className={pillButton}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </form>
          )}
        </section>

        {busy && (
          <section className="no-print max-w-3xl rounded-2xl border border-line bg-sheet p-6" aria-live="polite">
            <p className="font-display text-lg font-bold">Assaying your idea…</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {log.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-go">✓</span>
                  {l}
                </li>
              ))}
              <li className="flex items-center gap-2 text-muted">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Working
              </li>
            </ul>
          </section>
        )}

        {error && (
          <p role="alert" className="max-w-3xl rounded-xl border border-skip/30 bg-skip/5 p-4 text-skip">
            {error}
          </p>
        )}

        {mode === "compare" && pair && !busy && <Compare a={pair.a} b={pair.b} />}

        {mode !== "compare" && mode !== "history" && shown && !busy && (
          <div ref={resultRef} className="scroll-mt-4">
            {rep ? (
              <>
                <Certificate idea={shown.idea} result={shown.result} />
                <div className="no-print mt-4 flex flex-wrap items-center gap-2">
                  <a
                    className={pillButton}
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/?text=${encodeURIComponent(summaryText(shown.idea, shown.result) + " " + shareUrl())}`}
                  >
                    Share on WhatsApp
                  </a>
                  <button className={pillButton} onClick={copyLink}>
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                  <button className={pillButton} onClick={() => window.print()}>
                    Save as PDF
                  </button>
                  {shown.result.fromSnapshot && (
                    <button className={pillButton} disabled={busy} onClick={() => void run(shown.idea, lang, true)}>
                      Run live again
                    </button>
                  )}
                </div>
                <nav className="no-print sticky top-0 z-10 -mx-4 mt-6 overflow-x-auto border-b border-line bg-paper/90 px-4 backdrop-blur sm:mx-0 sm:px-0" aria-label="Report sections">
                  <ul className="flex gap-5 whitespace-nowrap py-3 text-sm font-medium text-muted">
                    {NAV.map(([id, label]) => (
                      <li key={id}>
                        <a href={`#${id}`} className="hover:text-brand">
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <Report idea={shown.idea} result={shown.result} checkKey={`${shown.idea}|${lang}`} />
              </>
            ) : (
              <div className="max-w-3xl rounded-2xl border border-line bg-sheet p-6">
                <p className="font-display text-xl font-bold">The AI report didn&apos;t finish.</p>
                <p className="mt-2 text-muted">The Google data was collected, but the analysis step failed. Try again in a minute.</p>
                <button className={`${pillButton} mt-4`} onClick={() => void run(shown.idea, lang)}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="no-print bg-brand-deep text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span className="font-display text-2xl font-extrabold">Parakh</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              Test a startup idea against live Google data before you spend months building it. A verdict, with the
              evidence shown.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Live data from</h2>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {["Google Trends", "Google Play", "Google News", "Google Jobs"].map((x) => (
                <li key={x} className="rounded-full border border-white/20 px-3 py-1">
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-white/75">Collected through SerpApi. Analysis by Gemini.</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Good to know</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>A verdict is a signal, not a guarantee. Talk to real customers too.</li>
              <li>Reports are saved on your device only.</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/60 sm:px-6">
            <span>Built by Vidhi</span>
            <span>परख means &ldquo;to test and judge&rdquo;.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
