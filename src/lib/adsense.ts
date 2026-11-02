// Only the public homepage may load this script after explicit advertising consent.
export const HOMEPAGE_ADSENSE_SCRIPT = {
  async: true,
  src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6541645442534489',
  crossOrigin: 'anonymous',
} as const;

export const ADVERTISING_CHOICE_KEY = 'famrecords-advertising-choice';
export const ADVERTISING_NOTICE = 'famrecords-advertising-v1';
export const ADVERTISING_NOTICE_TEXT = 'Allow Google AdSense and its advertising partners to use cookies, IP address and browser information to deliver, measure and personalise homepage ads? No medical or account details are shared.';
export type AdvertisingChoice = { accepted: boolean; notice: string; decidedAt: string; acceptedAt?: string };

export function readAdvertisingChoice(raw: string | null): AdvertisingChoice | null {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const choice = value as Partial<AdvertisingChoice>;
    if (choice.notice !== ADVERTISING_NOTICE || typeof choice.accepted !== 'boolean' || typeof choice.decidedAt !== 'string') return null;
    return choice as AdvertisingChoice;
  } catch { return null; }
}

export function advertisingPermitted(pathname: string, choice: AdvertisingChoice | null) {
  return pathname === '/' && choice?.accepted === true && choice.notice === ADVERTISING_NOTICE;
}

export function loadConsentedAds(document: Document, pathname: string, choice: AdvertisingChoice | null) {
  if (!advertisingPermitted(pathname, choice) || document.querySelector('script[src*="pagead/js/adsbygoogle.js"]')) return false;
  const script = document.createElement('script');
  script.src = HOMEPAGE_ADSENSE_SCRIPT.src;
  script.async = true;
  script.crossOrigin = HOMEPAGE_ADSENSE_SCRIPT.crossOrigin;
  document.head.appendChild(script);
  return true;
}