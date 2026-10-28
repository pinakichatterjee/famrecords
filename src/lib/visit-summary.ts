import { z } from 'zod';

// Facts are copied from reviewed Report Reader values and record details by code, never by AI.
export const factSchema = z.object({
  recordId: z.string(), recordName: z.string().max(300), recordDate: z.string().nullable(),
  testName: z.string().max(200), value: z.string().max(100).nullable(), unit: z.string().max(50).nullable(), referenceRange: z.string().max(100).nullable(),
}).strict();
export type Fact = z.infer<typeof factSchema>;

export const aiSummarySchema = z.object({
  overview: z.string().max(1500),
  explanations: z.array(z.object({ term: z.string().max(200), explanation: z.string().max(800), uncertain: z.boolean() }).strict()).max(30),
  questions: z.array(z.string().max(300)).max(10),
  limitations: z.array(z.string().max(400)).max(10),
}).strict();
export type AiSummary = z.infer<typeof aiSummarySchema>;

export const notesSchema = z.object({
  medications: z.string().max(3000), allergies: z.string().max(3000), other: z.string().max(3000),
}).strict();
export type SummaryNotes = z.infer<typeof notesSchema>;

export const sourceSchema = z.object({ id: z.string(), name: z.string(), date: z.string().nullable(), provider: z.string().nullable(), type: z.string().nullable() }).strict();

export const contentSchema = z.object({
  sources: z.array(sourceSchema).max(30),
  facts: z.array(factSchema).max(400),
  notes: notesSchema,
  ai: aiSummarySchema,
}).strict();
export type SummaryContent = z.infer<typeof contentSchema>;

const banned = /\b(diagnos\w*|you (?:have|likely|probably|should|must|need)|recommend\w*|prescrib\w*|treatment plan|(?:start|stop|increase|decrease|take) (?:the |your |this )?(?:medication|medicine|dose|tablet))\b|রোগ নির্ণয়|আপনার .* হয়েছে|ওষুধ (?:শুরু|বন্ধ) করুন/i;

const numbersIn = (s: string) => (s.replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.'));

/**
 * Validates AI text: schema, no diagnosis/treatment wording, and every number it mentions
 * must already appear in the source facts, record details or user notes (no invented values).
 */
export function validateAiSummary(raw: unknown, allowedText: string): AiSummary {
  const s = aiSummarySchema.parse(raw);
  const allowed = new Set(numbersIn(allowedText));
  const texts = [s.overview, ...s.explanations.flatMap(e => [e.term, e.explanation]), ...s.questions, ...s.limitations];
  for (const t of texts) {
    if (banned.test(t)) throw new Error('unsafe wording');
    for (const n of numbersIn(t)) if (!allowed.has(n)) throw new Error(`number not in sources: ${n}`);
  }
  return s;
}

type Extraction = { tests: { name: string; value: string | null; unit: string | null; referenceRange: string | null }[]; reportDate?: { value: string | null } };
export function buildFacts(records: { id: string; name: string; visit_date: string | null }[], reviewed: Record<string, Extraction>): Fact[] {
  return records.flatMap(r => (reviewed[r.id]?.tests ?? []).map(t => ({
    recordId: r.id, recordName: r.name, recordDate: r.visit_date ?? reviewed[r.id]?.reportDate?.value ?? null,
    testName: t.name, value: t.value, unit: t.unit, referenceRange: t.referenceRange,
  })));
}

/** Text the AI may quote numbers from. */
export function allowedSourceText(facts: Fact[], sources: { name: string; date: string | null }[], notes: SummaryNotes) {
  return [...facts.map(f => `${f.testName} ${f.value ?? ''} ${f.unit ?? ''} ${f.referenceRange ?? ''} ${f.recordDate ?? ''}`), ...sources.map(s => `${s.name} ${s.date ?? ''}`), notes.medications, notes.allergies, notes.other].join('\n');
}

/** A stable fingerprint of the content; any edit after review invalidates the review. */
export function contentFingerprint(c: SummaryContent) {
  const s = JSON.stringify(c); let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

export function summaryLines(c: SummaryContent, memberName: string, lang: 'en' | 'bn') {
  const t = lang === 'bn'
    ? { title: 'ডাক্তার দেখানোর সারাংশ', sources: 'উৎস নথি', facts: 'নথি থেকে তথ্য (যেমন ছাপা আছে)', meds: 'আপনার লেখা ওষুধ', allergy: 'আপনার লেখা অ্যালার্জি', notes: 'অন্যান্য নোট', ai: 'AI-লেখা সহজ ব্যাখ্যা (রোগ নির্ণয় নয়)', unsure: 'অনিশ্চিত', q: 'ডাক্তারকে জিজ্ঞাসা করার প্রশ্ন', lim: 'সীমাবদ্ধতা', none: 'নেই' }
    : { title: 'Doctor-visit summary', sources: 'Source documents', facts: 'Facts from your records (as printed)', meds: 'Medications you entered', allergy: 'Allergies you entered', notes: 'Other notes', ai: 'AI-written plain-language explanation (not a diagnosis)', unsure: 'uncertain', q: 'Questions you may want to ask', lim: 'Limitations', none: 'None' };
  const L: { heading?: boolean; text: string }[] = [{ heading: true, text: `${t.title} — ${memberName}` }];
  L.push({ heading: true, text: t.sources }, ...c.sources.map(s => ({ text: `• ${s.name}${s.date ? ` (${s.date})` : ''}${s.provider ? ` — ${s.provider}` : ''}` })));
  L.push({ heading: true, text: t.facts }, ...(c.facts.length ? c.facts.map(f => ({ text: `• ${f.testName}: ${f.value ?? '—'} ${f.unit ?? ''}${f.referenceRange ? ` [${f.referenceRange}]` : ''} — ${f.recordName}${f.recordDate ? `, ${f.recordDate}` : ''}` })) : [{ text: t.none }]));
  if (c.notes.medications) L.push({ heading: true, text: t.meds }, { text: c.notes.medications });
  if (c.notes.allergies) L.push({ heading: true, text: t.allergy }, { text: c.notes.allergies });
  if (c.notes.other) L.push({ heading: true, text: t.notes }, { text: c.notes.other });
  L.push({ heading: true, text: t.ai }, { text: c.ai.overview }, ...c.ai.explanations.map(e => ({ text: `• ${e.term}: ${e.explanation}${e.uncertain ? ` (${t.unsure})` : ''}` })));
  if (c.ai.questions.length) L.push({ heading: true, text: t.q }, ...c.ai.questions.map(q => ({ text: `• ${q}` })));
  if (c.ai.limitations.length) L.push({ heading: true, text: t.lim }, ...c.ai.limitations.map(q => ({ text: `• ${q}` })));
  return L;
}
