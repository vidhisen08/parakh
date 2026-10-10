export type Verdict = "GO" | "PIVOT" | "SKIP";

export type Trend = { date: string; value: number };
export type App = {
  title: string;
  rating?: number;
  developer?: string;
  downloads?: string;
  description?: string;
  link: string;
};
export type NewsItem = { title: string; source?: string; date?: string; link: string };
export type Job = { title: string; company?: string; location?: string };
export type Related = { query: string; value: string | number };

export type Competitor = {
  name: string;
  rating: number;
  weakness: string;
  evidence: string;
  evidenceStrength?: "strong" | "medium" | "weak";
};

export type Report = {
  score: number;
  scoreReason: string;
  demand: { direction: "rising" | "flat" | "falling"; note: string };
  competitors: Competitor[];
  gaps: string[];
  hiring?: string;
  newsSignals?: string[];
  verdict: Verdict;
  verdictReason: string;
  nextSteps: string[];
};

export type Keywords = { understood?: string } & Record<string, string | undefined>;

export type Result = {
  keywords: Keywords;
  trends: Trend[];
  related: Related[];
  apps: App[];
  news: NewsItem[];
  jobs: Job[];
  report: Report | null;
  generatedAt?: string;
  fromSnapshot?: boolean;
};

export type Lang = "en" | "hi";
