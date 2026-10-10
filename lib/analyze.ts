import { askGemini } from "./gemini";

export async function analyzeIdea(idea: string, data: unknown, lang = "en") {
  return askGemini(`You are a startup market analyst for Indian student founders.
Startup idea: "${idea}"

Below is LIVE data from Google Trends, Google Play, Google News and Google Jobs (India):
${JSON.stringify(data)}

Rules:
- Use ONLY this data. Do not invent apps, numbers or facts.
- Trends are weekly values from 0 to 100. Education topics can be seasonal, so say if a rise looks seasonal.
- If the data is too thin to judge something, say "not enough data".
- Competitor weaknesses must come from the app's description, rating or the news. Point to the evidence.
- Never call a rating of 4.0 or above a weakness. Never treat low downloads as a product weakness.
- Prefer weaknesses about what the product does NOT offer (for example: no AI tutoring, no adaptive learning, no doubt solving).
- If you cannot find real evidence for a competitor's weakness, write "no clear weakness in the data".
- Add "evidenceStrength" to each competitor: "strong", "medium" or "weak".
- Every company name, number and funding amount you mention must appear in the data above. Never use outside knowledge.
- If the verdict is GO while the score is above 70, verdictReason must name the specific gap from the data that justifies it.
- Every company name, number and funding amount you mention must appear in the data above. Never use outside knowledge.
- If the verdict is GO while the score is above 70, verdictReason must name the specific gap from the data that justifies it.
- The data includes "related": rising Google searches. Use them as evidence of what people want.
- Write every text value in ${lang === "hi" ? "Hindi (Devanagari script), keeping app and company names in English" : "English"}. Keep the JSON keys and the values GO, PIVOT, SKIP, strong, medium, weak, rising, flat, falling in English.

Return JSON only, in this exact shape:
{
  "score": number from 0 to 100 (0 = empty market, 100 = extremely crowded),
  "scoreReason": "one sentence",
  "demand": { "direction": "rising" | "flat" | "falling", "note": "one sentence" },
  "competitors": [ { "name": string, "rating": number, "weakness": string, "evidence": string, "evidenceStrength": "strong" | "medium" | "weak" } ],
  "gaps": [ "3 to 4 short opportunities nobody serves well" ],
  "hiring": "one sentence about what the jobs data says",
  "newsSignals": [ "2 to 3 short points from the news, such as funding or launches" ],
  "verdict": "GO" | "PIVOT" | "SKIP",
  "verdictReason": "2 sentences",
  "nextSteps": [ "3 concrete next steps for a student founder" ]
}
Include at most 5 competitors.`);
}