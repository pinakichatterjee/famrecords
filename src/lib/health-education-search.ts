import type { HealthEducationArticle, HealthEducationCategory } from "@/lib/health-education";

export type HealthEducationSearchCategory = HealthEducationCategory | "All";

export interface HealthEducationMatchContext {
  label: string;
  excerpt: string;
}

export interface HealthEducationSearchResult {
  article: HealthEducationArticle;
  score: number;
  matchContext: HealthEducationMatchContext | null;
}

export interface TextHighlightSegment {
  text: string;
  match: boolean;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function tokenizeSearchQuery(query: string): string[] {
  const cleaned = normalizeText(query);
  if (!cleaned) return [];
  return Array.from(new Set(cleaned.split(/[^a-z0-9\u0980-\u09ff]+/i).filter(Boolean)));
}

function makeExcerpt(text: string, tokens: string[], maxLength = 130): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const lower = clean.toLowerCase();
  let firstIdx = -1;
  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) {
      firstIdx = idx;
    }
  }
  if (firstIdx <= 30) {
    return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
  }
  const start = Math.max(0, firstIdx - 32);
  const slice = clean.slice(start, start + maxLength - 2).trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = start + maxLength - 2 < clean.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

export function searchHealthEducation(
  articles: readonly HealthEducationArticle[],
  query: string,
  category: HealthEducationSearchCategory = "All",
): HealthEducationSearchResult[] {
  const scoped =
    category === "All" ? articles : articles.filter((article) => article.category === category);

  const normalizedQuery = normalizeText(query);
  const tokens = tokenizeSearchQuery(query);

  if (tokens.length === 0) {
    return scoped.map((article) => ({
      article,
      score: 0,
      matchContext: null,
    }));
  }

  const results: HealthEducationSearchResult[] = [];

  for (const article of scoped) {
    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();
    const categoryLower = article.category.toLowerCase();
    const tagsLower = article.tags.map((t) => t.toLowerCase());

    const searchableSegments: Array<{ label: string; text: string; weight: number }> = [
      { label: "Title", text: article.title, weight: 40 },
      { label: "Category", text: article.category, weight: 25 },
      ...article.tags.map((tag) => ({ label: `Topic: ${tag}`, text: tag, weight: 25 })),
      { label: "Summary", text: article.summary, weight: 15 },
    ];

    for (const section of article.sections) {
      searchableSegments.push({
        label: `Section: ${section.heading}`,
        text: section.heading,
        weight: 22,
      });
      for (const paragraph of section.paragraphs) {
        searchableSegments.push({
          label: `Section: ${section.heading}`,
          text: paragraph,
          weight: 8,
        });
      }
      for (const bullet of section.bullets ?? []) {
        searchableSegments.push({
          label: `Section: ${section.heading}`,
          text: bullet,
          weight: 9,
        });
      }
    }

    for (const faq of article.faqs) {
      searchableSegments.push({
        label: `FAQ: ${faq.q}`,
        text: `${faq.q} ${faq.a}`,
        weight: 12,
      });
    }

    const combinedText = searchableSegments.map((s) => s.text.toLowerCase()).join(" ");
    const allTokensMatch = tokens.every((token) => combinedText.includes(token));
    if (!allTokensMatch) continue;

    let score = 0;
    if (titleLower.includes(normalizedQuery)) score += 100;
    else if (summaryLower.includes(normalizedQuery)) score += 45;

    for (const token of tokens) {
      if (titleLower.includes(token)) score += 40;
      if (categoryLower.includes(token)) score += 25;
      if (tagsLower.some((tag) => tag.includes(token))) score += 25;
      if (summaryLower.includes(token)) score += 15;
    }

    let bestContext: HealthEducationMatchContext | null = null;
    let bestSegmentScore = -1;

    for (const seg of searchableSegments) {
      const segLower = seg.text.toLowerCase();
      let segTokenHits = 0;
      for (const token of tokens) {
        if (segLower.includes(token)) segTokenHits += 1;
      }
      if (segTokenHits === 0) continue;

      const segScore =
        segTokenHits * seg.weight + (segLower.includes(normalizedQuery) ? seg.weight * 2 : 0);
      score += segTokenHits * Math.max(1, Math.floor(seg.weight / 4));

      if (seg.label !== "Title" && seg.label !== "Category" && segScore > bestSegmentScore) {
        bestSegmentScore = segScore;
        bestContext = {
          label: seg.label,
          excerpt: makeExcerpt(seg.text, tokens),
        };
      }
    }

    results.push({
      article,
      score,
      matchContext: bestContext,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function highlightMatches(text: string, query: string): TextHighlightSegment[] {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0 || !text) {
    return [{ text, match: false }];
  }

  const escaped = tokens
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: tokens.some((token) => part.toLowerCase() === token.toLowerCase()),
    }));
}
