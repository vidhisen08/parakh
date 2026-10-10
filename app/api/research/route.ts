/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getTrends, getPlay, getNews, getJobs, getRelated } from "@/lib/engines";
import { getKeywords } from "@/lib/keywords";
import { analyzeIdea } from "@/lib/analyze";
import { isExample, snapshotName } from "@/lib/examples";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

const safe = (p: Promise<any>) =>
  p.catch((e) => {
    console.error("Call failed:", e.message);
    return null;
  });

export async function GET(req: NextRequest) {
  const idea = req.nextUrl.searchParams.get("idea");
  const lang = req.nextUrl.searchParams.get("lang") === "hi" ? "hi" : "en";
  if (!idea) return NextResponse.json({ error: "Missing idea" }, { status: 400 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: any) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      const run = (p: Promise<any>, msg: (r: any) => string) =>
        safe(p).then((r) => {
          send({ type: "step", text: msg(r) });
          return r;
        });
      try {
        send({ type: "step", text: "Reading your idea" });
        let kw: any;
        try {
          kw = await getKeywords(idea);
        } catch (e: any) {
          console.error("Gemini failed:", e.message);
          send({ type: "error", message: "The AI is busy right now. Please try again in a minute." });
          return;
        }
        send({ type: "step", text: `Searching Google for: ${kw.trends}, ${kw.play}` });

        const trendsP = getTrends(kw.trends).then((r: any) =>
          r?.interest_over_time?.timeline_data?.length
            ? r
            : getTrends(kw.trendsBroad || "online learning")
        );
        const [trends, play, news, jobs, related] = await Promise.all([
          run(trendsP, (r) => `Google Trends: ${r?.interest_over_time?.timeline_data?.length ?? 0} weeks of demand data`),
          run(getPlay(kw.play), (r) => `Google Play: ${r?.organic_results?.[0]?.items?.length ?? 0} competing apps`),
          run(getNews(kw.news), (r) => `Google News: ${r?.news_results?.length ?? 0} articles`),
          run(getJobs(kw.jobs), (r) => `Google Jobs: ${r?.jobs_results?.length ?? 0} listings`),
          run(getRelated(kw.trends), (r) => `Rising searches: ${r?.related_queries?.rising?.length ?? 0} found`),
        ]);

        const data = {
          trends: (trends?.interest_over_time?.timeline_data ?? []).map((t: any) => ({
            date: t.date,
            value: t.values?.[0]?.extracted_value,
          })),
          related: (related?.related_queries?.rising ?? []).slice(0, 8).map((q: any) => ({
            query: q.query,
            value: q.value,
          })),
          apps: (play?.organic_results?.[0]?.items ?? []).slice(0, 8).map((a: any) => ({
            title: a.title,
            rating: a.rating,
            developer: a.author,
            downloads: a.downloads,
            description: a.description?.slice(0, 600),
            link: a.link,
          })),
          news: (news?.news_results ?? []).slice(0, 8).map((n: any) => ({
            title: n.title,
            source: n.source?.name,
            date: n.date,
            link: n.link,
          })),
          jobs: (jobs?.jobs_results ?? []).slice(0, 8).map((j: any) => ({
            title: j.title,
            company: j.company_name,
            location: j.location,
          })),
        };

        send({ type: "step", text: "Writing your report" });
        let report = null;
        try {
          report = await analyzeIdea(idea, data, lang);
        } catch (e: any) {
          console.error("Analysis failed:", e.message);
        }
        const payload = { keywords: kw, ...data, report, generatedAt: new Date().toISOString() };
        // Development only: keep a finished example report so the deployed site can show it instantly.
        if (process.env.NODE_ENV === "development" && report && isExample(idea)) {
          try {
            const dir = path.join(process.cwd(), "public", "demos");
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, `${snapshotName(idea, lang)}.json`), JSON.stringify(payload));
          } catch (e: any) {
            console.error("Snapshot not saved:", e.message);
          }
        }
        send({ type: "done", data: payload });
      } catch (e: any) {
        console.error("Route failed:", e.message);
        send({ type: "error", message: "Something went wrong. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" },
  });
}