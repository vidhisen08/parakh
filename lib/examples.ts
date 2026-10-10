// Shared by the server route and the page. No Node-only imports here.

export const EXAMPLES = [
  "AI tutor for JEE students",
  "Hyperlocal grocery delivery for tier-2 cities",
  "Resume builder for engineering freshers",
];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export const isExample = (idea: string) => EXAMPLES.includes(idea.trim());

// File name (without .json) of a saved example report in public/demos
export const snapshotName = (idea: string, lang: string) => `${slugify(idea)}-${lang}`;
