import { z } from 'zod';

export const explanationSchema = z.object({
  details: z.array(z.object({ explanation: z.string(), quote: z.string(), location: z.string() }).strict()),
  limitations: z.array(z.string()),
}).strict();
export type Explanation = z.infer<typeof explanationSchema>;
export function requireExplanationConsent(consent: unknown) {
  if (consent !== true) throw new Error('Please agree to AI processing of this record first.');
}
export function validateExplanation(value: unknown, sourceText?: string): Explanation {
  const parsed = explanationSchema.parse(value);
  if (parsed.details.length > 12) throw new Error('Too many details.');
  const advice = /\b(you (?:have|likely have|should|must|need to)|diagnos(?:e|ed|is)|(?:start|stop|increase|decrease|take|switch) (?:your |the )?(?:medication|medicine|dose|treatment)|recommend(?:ed)? treatment)\b/i;
  const details = parsed.details.map(d => {
    if (!d.quote.trim() || !d.location.trim() || !d.explanation.trim() || advice.test(d.explanation)) throw new Error('The explanation did not meet the source-only safety checks.');
    if (sourceText && !sourceText.replace(/\s+/g, ' ').includes(d.quote.replace(/\s+/g, ' ').trim())) throw new Error('A quoted detail could not be verified in the document.');
    return d;
  });
  return { details, limitations: parsed.limitations };
}