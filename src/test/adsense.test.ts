import { describe, expect, it } from 'vitest';
import { HOMEPAGE_ADSENSE_SCRIPT } from '../lib/adsense';

describe('homepage AdSense publisher', () => {
  it('uses the owner-supplied publisher ID', () => {
    const url = new URL(HOMEPAGE_ADSENSE_SCRIPT.src);
    expect(url.origin).toBe('https://pagead2.googlesyndication.com');
    expect(url.searchParams.get('client')).toBe('ca-pub-6541645442534489');
  });
});