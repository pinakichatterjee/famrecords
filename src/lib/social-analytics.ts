export const ANALYTICS_NOTICE = 'famrecords-public-analytics-v1';
export const ANALYTICS_CHOICE_KEY = 'famrecords-public-analytics-choice';
const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

export function publicAnalyticsLocation(input: string): string | null {
  const url = new URL(input);
  if (url.pathname !== '/' && url.pathname !== '/privacy') return null;
  const clean = new URL(url.pathname, url.origin);
  for (const tag of TAGS) {
    const value = url.searchParams.get(tag);
    // Campaign labels only: never forward arbitrary query strings or identifiers.
    if (value && /^[a-z0-9_-]{1,64}$/.test(value)) clean.searchParams.set(tag, value);
  }
  return clean.href;
}

export function campaignParameters(input: string) {
  const url = new URL(input);
  return {
    campaign_source: url.searchParams.get('utm_source') ?? undefined,
    campaign_medium: url.searchParams.get('utm_medium') ?? undefined,
    campaign_name: url.searchParams.get('utm_campaign') ?? undefined,
    campaign_content: url.searchParams.get('utm_content') ?? undefined,
  };
}