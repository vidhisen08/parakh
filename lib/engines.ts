import { serp } from "./serp";

export const getTrends = (q: string) =>
  serp({ engine: "google_trends", q, geo: "IN", data_type: "TIMESERIES", date: "today 12-m" });

export const getPlay = (q: string) =>
  serp({ engine: "google_play", q, store: "apps", gl: "in" });

export const getNews = (q: string) =>
  serp({ engine: "google_news", q, gl: "in" });

export const getJobs = (q: string) =>
  serp({ engine: "google_jobs", q, location: "India", hl: "en" });