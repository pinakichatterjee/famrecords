import { describe, expect, it } from 'vitest';
import { PLAN_LIMITS, PRICES, aiAllowanceProblem, effectivePlan, razorpayUpdate, verifyRazorpaySignature, hmacSha256Hex, planLimitMessage } from '@/lib/plans';
import { buildFacts, allowedSourceText, validateAiSummary, contentFingerprint, summaryLines } from '@/lib/visit-summary';

describe('plans', () => {
  it('Free allows 2 members, Premium 6', () => { expect(PLAN_LIMITS.free.members).toBe(2); expect(PLAN_LIMITS.premium.members).toBe(6); });
  it('prices are ₹149/₹999 and $3.99/$29.99', () => { expect(PRICES.INR).toEqual({ monthly: 149, yearly: 999 }); expect(PRICES.USD).toEqual({ monthly: 3.99, yearly: 29.99 }); });
  it('Free cannot create AI visit summaries', () => { expect(aiAllowanceProblem('free', 'visit_summary', 0)).toMatch(/Premium/); expect(aiAllowanceProblem('premium', 'visit_summary', 0)).toBeNull(); });
  it('monthly AI allowance is enforced', () => { expect(aiAllowanceProblem('free', 'report_reader', 3)).not.toBeNull(); expect(aiAllowanceProblem('free', 'report_reader', 2)).toBeNull(); expect(aiAllowanceProblem('premium', 'visit_summary', 15)).not.toBeNull(); });
  it('cancelled Premium lasts until period end, then Free', () => {
    const now = new Date('2026-11-01');
    expect(effectivePlan({ plan: 'premium', status: 'cancelled', current_period_end: '2026-11-10' }, now)).toBe('premium');
    expect(effectivePlan({ plan: 'premium', status: 'active', current_period_end: '2026-10-30' }, now)).toBe('free');
    expect(effectivePlan({ plan: 'premium', status: 'halted', current_period_end: null }, now)).toBe('free');
    expect(effectivePlan({ plan: 'premium', status: 'pending', current_period_end: null }, now)).toBe('free');
  });
  it('maps Razorpay events', () => {
    expect(razorpayUpdate('subscription.charged', { status: 'active', current_end: 1800000000 })?.status).toBe('active');
    expect(razorpayUpdate('subscription.cancelled', { status: 'cancelled' })?.cancel_at_period_end).toBe(true);
    expect(razorpayUpdate('payment.captured', { status: 'x' })).toBeNull();
  });
  it('rejects webhooks with a bad or missing signature', async () => {
    const body = '{"event":"subscription.charged"}';
    const good = await hmacSha256Hex('whsec', body);
    expect(await verifyRazorpaySignature('whsec', body, good)).toBe(true);
    expect(await verifyRazorpaySignature('whsec', body, good.replace(/.$/, c => c === '0' ? '1' : '0'))).toBe(false);
    expect(await verifyRazorpaySignature('whsec', body + ' ', good)).toBe(false);
    expect(await verifyRazorpaySignature('whsec', body, null)).toBe(false);
    expect(await verifyRazorpaySignature('', body, good)).toBe(false);
  });
  it('turns the database limit error into a friendly message', () => {
    expect(planLimitMessage({ message: 'PLAN_LIMIT: Your free plan allows up to 2 family members.' })).toMatch(/^Your free plan allows up to 2 family members\. Upgrade/);
  });
});

describe('visit summary', () => {
  const records = [{ id: 'r1', name: 'CBC March', visit_date: '2026-03-12' }];
  const reviewed = { r1: { tests: [{ name: 'Haemoglobin', value: '13.2', unit: 'g/dL', referenceRange: '12.0-15.0' }] } };
  const facts = buildFacts(records, reviewed);
  const allowed = allowedSourceText(facts, [{ name: 'CBC March', date: '2026-03-12' }], { medications: 'Metformin 500 mg', allergies: '', other: '' });
  const ok = { overview: 'This summary includes one CBC report from 2026-03-12.', explanations: [{ term: 'Haemoglobin', explanation: 'A protein in red blood cells that carries oxygen.', uncertain: false }], questions: ['What does my Haemoglobin of 13.2 g/dL mean for me?'], limitations: [] };

  it('copies values, units and source exactly from reviewed data', () => {
    expect(facts).toEqual([{ recordId: 'r1', recordName: 'CBC March', recordDate: '2026-03-12', testName: 'Haemoglobin', value: '13.2', unit: 'g/dL', referenceRange: '12.0-15.0' }]);
  });
  it('accepts safe output whose numbers are in the sources', () => { expect(validateAiSummary(ok, allowed).overview).toBe(ok.overview); });
  it('rejects invented numbers', () => { expect(() => validateAiSummary({ ...ok, overview: 'Haemoglobin was 14.1.' }, allowed)).toThrow(/number/); });
  it('rejects Bengali digits that are not in the sources', () => { expect(() => validateAiSummary({ ...ok, overview: 'হিমোগ্লোবিন ১৪.১' }, allowed)).toThrow(/number/); });
  it('accepts Bengali digits matching sources', () => { expect(() => validateAiSummary({ ...ok, overview: 'হিমোগ্লোবিন ১৩.২ g/dL' }, allowed)).not.toThrow(); });
  it('rejects diagnosis and treatment advice', () => {
    expect(() => validateAiSummary({ ...ok, overview: 'You have anaemia.' }, allowed)).toThrow();
    expect(() => validateAiSummary({ ...ok, questions: ['You should stop the medication.'] }, allowed)).toThrow();
    expect(() => validateAiSummary({ ...ok, overview: 'This suggests a diagnosis of diabetes.' }, allowed)).toThrow();
  });
  it('rejects malformed AI output', () => {
    expect(() => validateAiSummary({ overview: 'x' }, allowed)).toThrow();
    expect(() => validateAiSummary({ ...ok, extra: 1 }, allowed)).toThrow();
    expect(() => validateAiSummary('not json', allowed)).toThrow();
  });
  it('any edit changes the review fingerprint', () => {
    const c = { sources: [{ id: 'r1', name: 'CBC March', date: '2026-03-12', provider: null, type: null }], facts, notes: { medications: '', allergies: '', other: '' }, ai: ok };
    const before = contentFingerprint(c);
    expect(contentFingerprint({ ...c, facts: [{ ...facts[0], value: '13.3' }] })).not.toBe(before);
  });
  it('export keeps source name/date beside each fact and separates AI text', () => {
    const c = { sources: [{ id: 'r1', name: 'CBC March', date: '2026-03-12', provider: null, type: null }], facts, notes: { medications: '', allergies: '', other: '' }, ai: ok };
    const text = summaryLines(c, 'Ma', 'bn').map(l => l.text).join('\n');
    expect(text).toContain('Haemoglobin: 13.2 g/dL [12.0-15.0] — CBC March, 2026-03-12');
    expect(text).toContain('AI-লেখা');
  });
});
