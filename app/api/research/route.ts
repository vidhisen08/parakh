/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { getTrends, getPlay, getNews, getJobs } from "@/lib/engines";

const safe = (p: Promise<any>) =>
  p.catch((e) => {
    console.error("SerpApi call failed:", e.message);
    return null;
  });

export async function GET(req: NextRequest) {
  const idea = req.nextUrl.searchParams.get("idea");
  const keyword = req.nextUrl.searchParams.get("keyword") || idea;
  if (!idea) return NextResponse.json({ error: "Missing idea" }, { status: 400 });

  const [trends, play, news, jobs] = await Promise.all([
    safe(getTrends(keyword!)),
    safe(getPlay(idea)),
    safe(getNews(keyword!)),
    safe(getJobs(keyword!)),
  ]);

  return NextResponse.json({
    trends: (trends?.interest_over_time?.timeline_data ?? []).map((t: any) => ({
      date: t.date,
      value: t.values?.[0]?.extracted_value,
    })),
    apps: (play?.organic_results?.[0]?.items ?? []).slice(0, 8).map((a: any) => ({
      title: a.title,
      rating: a.rating,
      developer: a.author,
      downloads: a.downloads,
      description: a.description?.slice(0, 300),
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
  });
}