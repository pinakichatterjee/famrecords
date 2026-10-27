// Preparation only. No SDK, cookies, network requests or queued historical events.
// Activation needs explicit owner approval AND a verified eligible Meta dataset.
export const signupTracking = {
  active: false,
  providerEligibilityVerified: false,
  pixelId: null,
  event: 'CompleteRegistration',
  noticeVersion: 'famrecords-advertising-v1',
} as const;

export type AdvertisingChoice = 'accepted' | 'rejected' | 'unanswered';

export function mayReportSignup(input: {
  active: boolean; eligibilityVerified: boolean; success: boolean;
  publicPage: boolean; consentRequired: boolean; regionResolved: boolean;
  choice: AdvertisingChoice;
}) {
  if (!input.active || !input.eligibilityVerified || !input.success || !input.publicPage) return false;
  if (input.choice === 'rejected') return false;
  if (!input.regionResolved || input.consentRequired) return input.choice === 'accepted';
  return true;
}

export function prepareSignupMeasurement(success: boolean): void {
  // Deliberately discard every event while inactive; never replay after activation.
  if (!mayReportSignup({ active: signupTracking.active,
    eligibilityVerified: signupTracking.providerEligibilityVerified, success,
    publicPage: true, consentRequired: true, regionResolved: false, choice: 'unanswered' })) return;
}