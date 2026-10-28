import { describe, expect, it } from 'vitest';
import { assertAdminChange, validatePassword } from '@/lib/account-rules';
import { mayReportSignup, signupTracking } from '@/lib/signup-tracking';

describe('Account requirements', () => {
  it('prevents admins removing their own access', () => {
    expect(() => assertAdminChange('owner', 'owner', false)).toThrow();
    expect(() => assertAdminChange('owner', 'other', false)).not.toThrow();
  });
  it('rejects mismatched passwords', () => {
    expect(validatePassword('strongpassword', 'different')).toBeTruthy();
    expect(validatePassword('strongpassword', 'strongpassword')).toBeNull();
  });
});

const allowed = { active: true, eligibilityVerified: true, success: true, publicPage: true, consentRequired: false, regionResolved: true, choice: 'accepted' as const };
describe('Sign-up advertising preparation', () => {
  it('is inactive until owner approval', () => {
    expect(signupTracking.active).toBe(false);
    expect(mayReportSignup({ ...allowed, active: signupTracking.active })).toBe(false);
  });
  it('blocks unverified health-context eligibility', () => {
    expect(mayReportSignup({ ...allowed, eligibilityVerified: false })).toBe(false);
  });
  it('honors refusal in every region', () => {
    expect(mayReportSignup({ ...allowed, choice: 'rejected' })).toBe(false);
  });
  it('requires acceptance in consent regions', () => {
    expect(mayReportSignup({ ...allowed, consentRequired: true, choice: 'unanswered' })).toBe(false);
    expect(mayReportSignup({ ...allowed, consentRequired: true })).toBe(true);
  });
  it('requires acceptance for unresolved regions', () => {
    expect(mayReportSignup({ ...allowed, regionResolved: false, choice: 'unanswered' })).toBe(false);
  });
  it('blocks signed-in pages', () => {
    expect(mayReportSignup({ ...allowed, publicPage: false })).toBe(false);
  });
  it('requires a successful sign-up', () => {
    expect(mayReportSignup({ ...allowed, success: false })).toBe(false);
  });
});