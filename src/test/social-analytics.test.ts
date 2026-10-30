import { describe, expect, it } from 'vitest';
import { campaignParameters, publicAnalyticsLocation } from '../lib/social-analytics';

describe('public social analytics', () => {
  it('excludes medical and account pages', () => {
    for (const path of ['/auth', '/dashboard', '/members', '/records', '/settings', '/admin', '/reset-password']) {
      expect(publicAnalyticsLocation(`https://www.famrecords.org${path}?utm_source=facebook`)).toBeNull();
    }
  });
  it('forwards only campaign labels on public pages', () => {
    expect(publicAnalyticsLocation('https://www.famrecords.org/?utm_source=facebook&utm_medium=social&utm_campaign=family_launch&utm_content=post_1&email=test@example.com#private')).toBe('https://www.famrecords.org/?utm_source=facebook&utm_medium=social&utm_campaign=family_launch&utm_content=post_1');
    expect(publicAnalyticsLocation('https://www.famrecords.org/privacy?utm_content=name@example.com&record_id=123')).toBe('https://www.famrecords.org/privacy');
  });
  it('maps platform campaign and post to Google reporting fields', () => {
    expect(campaignParameters('https://www.famrecords.org/?utm_source=facebook&utm_medium=social&utm_campaign=family_launch&utm_content=visit_pack_post')).toEqual({ campaign_source: 'facebook', campaign_medium: 'social', campaign_name: 'family_launch', campaign_content: 'visit_pack_post' });
  });
});