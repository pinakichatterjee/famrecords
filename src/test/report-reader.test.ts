import { describe, expect, it } from 'vitest';
import { rateLimitFailure, validateExtraction, validateFile, validateCorrection } from '@/lib/report-reader';

const ok = () => ({
  documentType: { value: 'Complete Blood Count', certainty: 'printed', sourceQuote: 'COMPLETE BLOOD COUNT' },
  reportDate: { value: null, certainty: 'unknown', sourceQuote: null },
  tests: [{ name: 'Haemoglobin', value: '13.2', unit: 'g/dL', referenceRange: '13.0-17.0', certainty: 'printed', sourceQuote: 'Haemoglobin 13.2 g/dL', location: 'page 1' }],
  limitations: [],
});

describe('report reader', () => {
  it('accepts valid output with explicit unknowns', () => { expect(validateExtraction(ok()).tests).toHaveLength(1); });
  it('rejects malformed output', () => {
    expect(() => validateExtraction({ tests: 'x' })).toThrow();
    expect(() => validateExtraction({ ...ok(), extra: 1 })).toThrow();
  });
  it('rejects an unknown field that carries a value (inferred)', () => {
    const e = ok(); e.reportDate = { value: '2026-01-01', certainty: 'unknown', sourceQuote: null };
    expect(() => validateExtraction(e)).toThrow();
  });
  it('rejects diagnosis or treatment wording', () => {
    const e = ok(); e.limitations = ['This suggests a diagnosis of anaemia'];
    expect(() => validateExtraction(e)).toThrow();
  });
  it('enforces file type and 10 MB limit', () => {
    expect(validateFile('u/a.pdf', 1000)).toBeNull();
    expect(validateFile('u/a.docx', 1000)).toBe('unsupported_file');
    expect(validateFile('u/a.png', 10 * 1024 * 1024 + 1)).toBe('too_large');
  });
  it('limits 10 per hour, 30 per day and 3 per record', () => {
    const now = new Date();
    const recent = Array.from({ length: 10 }, () => new Date(now.getTime() - 60_000));
    expect(rateLimitFailure(recent.slice(0, 9), now, 0)).toBeNull();
    expect(rateLimitFailure(recent, now, 0)).toBe('rate_limited');
    const old = Array.from({ length: 30 }, () => new Date(now.getTime() - 7200_000));
    expect(rateLimitFailure(old, now, 0)).toBe('rate_limited');
    expect(rateLimitFailure([], now, 3)).toBe('attempts_exhausted');
  });
  it('corrections reject bad dates', () => {
    const e = ok(); e.reportDate = { value: '1/2/26', certainty: 'printed', sourceQuote: 'x' };
    expect(() => validateCorrection(e)).toThrow();
  });
});
