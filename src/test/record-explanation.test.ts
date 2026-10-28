import { describe, expect, it } from 'vitest';
import { requireExplanationConsent, validateExplanation } from '@/lib/record-explanation';
describe('source-only explanations', () => {
  it('requires explicit processing consent', () => { expect(() => requireExplanationConsent(false)).toThrow(); expect(() => requireExplanationConsent(true)).not.toThrow(); });
  it('requires a quote and source location', () => { expect(() => validateExplanation({ details: [{ explanation: 'A measured value.', quote: '', location: 'Page 1' }], limitations: [] })).toThrow(); });
  it('rejects inferred diagnoses', () => { expect(() => validateExplanation({ details: [{ explanation: 'You likely have diabetes.', quote: 'Glucose 100', location: 'Page 1' }], limitations: [] })).toThrow(); });
  it('rejects treatment recommendations', () => { expect(() => validateExplanation({ details: [{ explanation: 'You should increase your medication.', quote: 'Glucose 100', location: 'Page 1' }], limitations: [] })).toThrow(); });
  it('checks Word quotes against extracted text', () => { expect(() => validateExplanation({ details: [{ explanation: 'A measured value.', quote: 'Glucose 100', location: 'Glucose row' }], limitations: [] }, 'Glucose 90')).toThrow(); });
  it('accepts sourced plain-language details', () => { expect(validateExplanation({ details: [{ explanation: 'This is the recorded measurement, not a diagnosis.', quote: 'Glucose 90', location: 'Glucose row' }], limitations: ['No interpretation provided.'] }, 'Glucose 90').details[0]?.quote).toBe('Glucose 90'); });
});