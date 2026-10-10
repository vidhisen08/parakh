import { askGemini } from "./gemini";

export async function getKeywords(idea: string) {
  return askGemini(`A user has this startup idea: "${idea}".
First decide what the idea most likely means as a business. If it is short or ambiguous (a place name, an abbreviation, a few words), choose the most likely startup meaning. Never treat a place name or abbreviation as an existing company unless the idea clearly says so.
Return JSON only, in this exact shape:
{
  "understood": "one sentence saying what startup idea you understood",
  "trends": "1-2 words, a BROAD popular search term people actually type, e.g. 'JEE preparation' or 'online tutor'",
  "trendsBroad": "1-2 words, an even broader term, e.g. 'edtech' or 'online learning'",
  "news": "short news topic related to the idea, include India",
  "jobs": "a common job title in this industry, 1-3 words, e.g. 'online tutor' or 'edtech'",
  "play": "app store search phrase a user would type to find similar apps"
}
Rules: never put the full idea sentence in trends or jobs. Keep trends and jobs simple and popular.`);
}