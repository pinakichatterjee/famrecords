import { describe, expect, it } from 'vitest';
import { HOMEPAGE_ADSENSE_SCRIPT, ADVERTISING_NOTICE, advertisingPermitted, readAdvertisingChoice, loadConsentedAds } from '../lib/adsense';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from '../routeTree.gen';

describe('homepage AdSense publisher', () => {
  it('uses the owner-supplied publisher ID', () => {
    const url = new URL(HOMEPAGE_ADSENSE_SCRIPT.src);
    expect(url.origin).toBe('https://pagead2.googlesyndication.com');
    expect(url.searchParams.get('client')).toBe('ca-pub-6541645442534489');
  });

  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  for (const [id, route] of Object.entries(router.routesById)) {
    it(`never loads AdSense through an unconditional route head: ${id}`, async () => {
      const head = route.options.head;
      const result = (head ? await Reflect.apply(head, undefined, [{}]) : undefined) as
        { scripts?: Array<{ src?: string; children?: string }> } | undefined;
      const adScripts = (result?.scripts ?? []).filter((script: { src?: string; children?: string }) =>
        /adsbygoogle|googlesyndication|ca-pub-/i.test(`${script.src ?? ''} ${script.children ?? ''}`),
      );
      expect(adScripts).toEqual([]);
    });
  }
});

describe('advertising consent', () => {
  const accepted = { accepted: true, notice: ADVERTISING_NOTICE, decidedAt: '2026-11-02T04:38:00Z' };
  it('blocks AdSense before a choice', () => { expect(advertisingPermitted('/', null)).toBe(false); });
  it('blocks AdSense after advertising refusal', () => { expect(advertisingPermitted('/', { ...accepted, accepted: false })).toBe(false); });
  it('permits only explicitly accepted homepage advertising', () => { expect(advertisingPermitted('/', accepted)).toBe(true); expect(advertisingPermitted('/records', accepted)).toBe(false); });
  it('does not treat analytics acceptance or old notices as advertising permission', () => {
    expect(readAdvertisingChoice(JSON.stringify({ ...accepted, notice: 'famrecords-public-analytics-v1' }))).toBeNull();
    expect(advertisingPermitted('/', { ...accepted, notice: 'old' })).toBe(false);
  });
  it('never inserts a script for unanswered or declined advertising', () => {
    const doc = { querySelector: () => null, createElement: () => { throw new Error('must not create script'); } } as unknown as Document;
    expect(loadConsentedAds(doc, '/', null)).toBe(false);
    expect(loadConsentedAds(doc, '/', { ...accepted, accepted: false })).toBe(false);
  });
});