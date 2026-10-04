import fs from "fs";
import crypto from "crypto";

const CACHE_DIR = ".cache";

export async function serp(params: Record<string, string>) {
  const query = new URLSearchParams({ ...params, api_key: process.env.SERPAPI_KEY! });
  const key = crypto.createHash("md5").update(JSON.stringify(params)).digest("hex");
  const file = `${CACHE_DIR}/${key}.json`;

  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));

  const res = await fetch(`https://serpapi.com/search.json?${query}`);
  if (!res.ok) {
  const body = await res.text();
  throw new Error(`SerpApi error ${res.status}: ${body}`);
}
  const data = await res.json();

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}