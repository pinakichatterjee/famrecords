import { describe, expect, it } from 'vitest';
import { HOMEPAGE_ADSENSE_SCRIPT } from '../lib/adsense';
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
    it(`permits the AdSense runtime only in the homepage head: ${id}`, async () => {
      const head = route.options.head;
      const result = (head ? await Reflect.apply(head, undefined, [{}]) : undefined) as
        { scripts?: Array<{ src?: string; children?: string }> } | undefined;
      const adScripts = (result?.scripts ?? []).filter((script: { src?: string; children?: string }) =>
        /adsbygoogle|googlesyndication|ca-pub-/i.test(`${script.src ?? ''} ${script.children ?? ''}`),
      );
      if (id === '/') {
        expect(adScripts).toEqual([HOMEPAGE_ADSENSE_SCRIPT]);
      } else {
        expect(adScripts).toEqual([]);
      }
    });
  }
});