import fs from "fs";
import crypto from "crypto";

const CACHE_DIR = process.env.VERCEL ? "/tmp" : ".cache";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function askGemini(prompt: string) {
  const models = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    process.env.GEMINI_FALLBACK_MODEL,
  ].filter(Boolean) as string[];

  const hash = crypto.createHash("md5").update(prompt).digest("hex");
  const file = `${CACHE_DIR}/gemini-${hash}.json`;
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));

  let lastError = "";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            fs.mkdirSync(CACHE_DIR, { recursive: true });
            fs.writeFileSync(file, JSON.stringify(parsed));
            return parsed;
          } catch {
            lastError = `${model}: invalid JSON`;
          }
        } else {
          lastError = `${model}: empty answer`;
        }
      } else {
        lastError = `${model}: error ${res.status}`;
        if (res.status !== 429 && res.status !== 503) break;
      }
      if (attempt < 2) await sleep(4000);
    }
  }
  throw new Error(lastError);
}