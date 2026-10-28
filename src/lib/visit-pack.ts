import type { FilterableRecord } from './record-filters';
import { healthCopy, healthDate, categoryLabel, type HealthLanguage } from './health-copy';

export type PackRecord = FilterableRecord & { id: string };
export type PackDraft = { memberId: string; selectedIds: string[]; start: string; end: string; allergies: string; medications: string; questions: string; language: HealthLanguage };
export function packCandidates<T extends PackRecord>(records: T[], memberId: string, start: string, end: string) {
  return records.filter(r => r.family_member_id === memberId && (!r.visit_date || ((!start || r.visit_date >= start) && (!end || r.visit_date <= end))));
}
export function packFingerprint(draft: PackDraft, records: PackRecord[], memberName: string) {
  return JSON.stringify({ draft, memberName, sources: records.filter(r => draft.selectedIds.includes(r.id)).map(r => ({ id: r.id, name: r.name, family_member_id: r.family_member_id, record_type: r.record_type, provider: r.provider, visit_date: r.visit_date, created_at: r.created_at })) });
}
export const packApproved = (approved: string | null, current: string) => approved !== null && approved === current;
export type PackLine = { text: string; heading?: boolean };
export function buildPackLines(draft: PackDraft, records: PackRecord[], memberName: string, generatedAt: string): PackLine[] {
  const c = healthCopy[draft.language];
  const sources = packCandidates(records, draft.memberId, draft.start, draft.end).filter(r => draft.selectedIds.includes(r.id));
  const lines: PackLine[] = [
    { text: `FamRecords — ${c.pack}`, heading: true },
    { text: `${c.member}: ${memberName}` },
    { text: `${c.generation}: ${healthDate(generatedAt, draft.language)}` },
    { text: `${c.range}: ${draft.start ? healthDate(draft.start, draft.language) : '—'} → ${draft.end ? healthDate(draft.end, draft.language) : '—'}` },
    { text: c.packNote }, { text: c.sources, heading: true },
  ];
  sources.forEach((r, i) => {
    lines.push({ text: `${i + 1}. ${r.name}`, heading: true },
      { text: `${c.type}: ${r.record_type ? categoryLabel(r.record_type, draft.language) : c.noEntry}` },
      { text: `${c.provider}: ${r.provider ?? c.noEntry}` },
      { text: `${c.documentDate}: ${r.visit_date ? healthDate(r.visit_date, draft.language) : c.missingDate}` },
      { text: `${c.uploaded}: ${healthDate(r.created_at, draft.language)}` });
  });
  lines.push({ text: c.manualNotice, heading: true });
  for (const field of ['allergies', 'medications', 'questions'] as const) lines.push({ text: c[field], heading: true }, { text: draft[field].trim() || c.noEntry });
  return lines;
}