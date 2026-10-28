import { z } from 'zod';

export const REPORT_MAX_BYTES = 10 * 1024 * 1024;
export const REPORT_TYPES: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
export const HOURLY_LIMIT = 10;
export const DAILY_LIMIT = 30;
export const MAX_ATTEMPTS_PER_RECORD = 3;

export type FailureCode = 'unsupported_file' | 'too_large' | 'unreadable' | 'malformed_output' | 'rate_limited' | 'attempts_exhausted' | 'credits' | 'ai_unavailable' | 'ai_blocked' | 'plan_limit';
export const FAILURE_MESSAGES: Record<FailureCode, string> = {
  unsupported_file: 'Report reading works for PDFs and JPG, PNG or WEBP photos.',
  too_large: 'Reports must be 10 MB or smaller to read.',
  unreadable: 'The report could not be read clearly. Try a sharper photo or a text PDF.',
  malformed_output: 'The AI result failed our safety and format checks, so nothing was saved. You can retry.',
  rate_limited: 'Too many report readings. Please wait an hour and try again.',
  attempts_exhausted: 'This report has reached its 3 reading attempts.',
  credits: 'AI credits have run out. The app owner must add credits.',
  ai_unavailable: 'The AI service is unavailable right now. Please retry later.',
  ai_blocked: 'AI access is blocked for this account.',
  plan_limit: "You've used this month's AI report readings for your plan. Premium Family includes more.",
};

const certainty = z.enum(['printed', 'uncertain', 'unknown']);
const field = z.object({ value: z.string().nullable(), certainty, sourceQuote: z.string().nullable() }).strict();
export const testSchema = z.object({
  name: z.string().min(1).max(200), value: z.string().max(100).nullable(), unit: z.string().max(50).nullable(),
  referenceRange: z.string().max(100).nullable(), certainty, sourceQuote: z.string().max(300).nullable(), location: z.string().max(100).nullable(),
}).strict();
export const extractionSchema = z.object({
  documentType: field, reportDate: field,
  tests: z.array(testSchema).max(80),
  limitations: z.array(z.string().max(500)).max(20),
}).strict();
export type Extraction = z.infer<typeof extractionSchema>;
export type ReportTest = z.infer<typeof testSchema>;

const banned = /\b(diagnos\w*|you (?:have|likely|should|must|need)|recommend\w*|treatment|prescrib\w*|abnormal|high risk|low risk|disease|(?:start|stop|increase|decrease|take) (?:the |your )?(?:medication|medicine|dose))\b/i;

export function validateFile(path: string, size: number): FailureCode | null {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (!REPORT_TYPES[ext]) return 'unsupported_file';
  if (size > REPORT_MAX_BYTES) return 'too_large';
  if (!size) return 'unreadable';
  return null;
}

/** Validates AI output: schema, no invented/diagnostic content, unknown fields stay empty. */
export function validateExtraction(raw: unknown): Extraction {
  const e = extractionSchema.parse(raw);
  const check = (s: string | null) => { if (s && banned.test(s)) throw new Error('unsafe'); };
  for (const f of [e.documentType, e.reportDate]) {
    check(f.value);
    if (f.certainty === 'unknown' && f.value !== null) throw new Error('unknown field has a value');
    if (f.certainty === 'printed' && (!f.value || !f.sourceQuote)) throw new Error('printed field needs a quote');
  }
  if (e.reportDate.value && !/^\d{4}-\d{2}-\d{2}$/.test(e.reportDate.value)) throw new Error('bad date');
  for (const t of e.tests) {
    [t.name, t.value, t.unit, t.referenceRange].forEach(check);
    if (t.certainty === 'printed' && (!t.value || !t.sourceQuote)) throw new Error('printed test needs value and quote');
    if (t.certainty === 'unknown' && t.value !== null) throw new Error('unknown test has a value');
  }
  e.limitations.forEach(check);
  return e;
}

/** Reviewed corrections: same shape, user may edit text freely but not add AI-style claims. */
export function validateCorrection(raw: unknown): Extraction {
  const e = extractionSchema.parse(raw);
  if (e.reportDate.value && !/^\d{4}-\d{2}-\d{2}$/.test(e.reportDate.value)) throw new Error('Report date must be YYYY-MM-DD.');
  return e;
}

export function rateLimitFailure(attemptTimes: Date[], now: Date, recordAttempts: number): FailureCode | null {
  if (recordAttempts >= MAX_ATTEMPTS_PER_RECORD) return 'attempts_exhausted';
  const hour = attemptTimes.filter(t => now.getTime() - t.getTime() < 3600_000).length;
  const day = attemptTimes.filter(t => now.getTime() - t.getTime() < 86400_000).length;
  return hour >= HOURLY_LIMIT || day >= DAILY_LIMIT ? 'rate_limited' : null;
}
