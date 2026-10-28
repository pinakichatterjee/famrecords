import { describe, expect, it } from 'vitest';
import { dateSchema, eventSchema, hasDocumentSignature, ownsRelationship, validateDocument, MAX_DOCUMENT_BYTES } from '@/lib/health-rules';
import { timelineGroups, type HealthEvent } from '@/lib/health-timeline';
import { packCandidates, packFingerprint, packApproved, buildPackLines, type PackDraft } from '@/lib/visit-pack';

const record = { id: 'r1', name: 'Synthetic report', family_member_id: 'm1', provider: null, record_type: 'Lab report', visit_date: '2026-01-10', created_at: '2026-02-05T12:00:00Z', ai_summary: 'Unverified diagnosis must never enter pack' };
const undated = { ...record, id: 'r2', name: 'Undated report', visit_date: null };
const other = { ...record, id: 'r3', family_member_id: 'm2' };
const event: HealthEvent = { id: 'e1', user_id: 'u1', family_member_id: 'm1', event_type: 'appointment', title: 'Synthetic appointment', event_date: '2026-01-11', event_time: null, provider: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
const filters = { member: 'm1', type: 'all', provider: 'all', search: '' };
const draft: PackDraft = { memberId: 'm1', selectedIds: ['r1', 'r2', 'r3'], start: '2026-01-01', end: '2026-01-31', allergies: 'User-entered allergy', medications: '', questions: 'What should I ask?', language: 'en' };

describe('Timeline rules', () => {
  it('merges manual events and records by month with an upload fallback', () => {
    const groups = timelineGroups([record, undated, other], [event], filters);
    expect(groups.map(g => g.month)).toEqual(['2026-02', '2026-01']);
    expect(groups[1]?.items.map(r => r.kind)).toEqual(['event', 'record']);
  });
  it('includes both date filter endpoints', () => {
    expect(timelineGroups([record], [event], { ...filters, start: '2026-01-10', end: '2026-01-11' })[0]?.items.length).toBe(2);
    expect(timelineGroups([record], [event], { ...filters, start: '2026-01-12' })).toEqual([]);
  });
  it('filters manual appointments without including documents', () => {
    expect(timelineGroups([record], [event], { ...filters, type: 'appointment' })[0]?.items.map(r => r.kind)).toEqual(['event']);
  });
});
describe('Document and ownership rules', () => {
  it('enforces the 20 MB upload maximum and nonempty documents', () => {
    expect(validateDocument({ name: 'report.pdf', size: MAX_DOCUMENT_BYTES, type: 'application/pdf' })).toBeNull();
    expect(validateDocument({ name: 'report.pdf', size: MAX_DOCUMENT_BYTES + 1, type: 'application/pdf' })).toBeTruthy();
    expect(validateDocument({ name: 'report.pdf', size: 0, type: 'application/pdf' })).toBeTruthy();
  });
  it('rejects unsupported types and disguised PDF content', () => {
    expect(validateDocument({ name: 'report.html', size: 100, type: 'text/html' })).toBeTruthy();
    expect(hasDocumentSignature(new TextEncoder().encode('<html>'), 'report.pdf')).toBe(false);
    expect(hasDocumentSignature(new TextEncoder().encode('%PDF-1.7'), 'report.pdf')).toBe(true);
  });
  it('requires member and storage ownership to match the caller', () => {
    expect(ownsRelationship('u1', 'u1', 'u1/report.pdf')).toBe(true);
    expect(ownsRelationship('u1', 'u2', 'u1/report.pdf')).toBe(false);
    expect(ownsRelationship('u1', 'u1', 'u2/report.pdf')).toBe(false);
  });
  it('validates real dates and manual event types', () => {
    expect(dateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(dateSchema.safeParse('2026-02-28').success).toBe(true);
    expect(eventSchema.safeParse({ event_type: 'diagnosis' }).success).toBe(false);
  });
});
describe('Doctor Visit Pack rules', () => {
  it('keeps undated documents available but excludes other family members', () => {
    expect(packCandidates([record, undated, other], 'm1', '2026-01-10', '2026-01-10').map(r => r.id)).toEqual(['r1', 'r2']);
  });
  it('requires approval and invalidates it after clinical draft edits', () => {
    const fingerprint = packFingerprint(draft, [record, undated], 'Synthetic member');
    expect(packApproved(null, fingerprint)).toBe(false);
    expect(packApproved(fingerprint, fingerprint)).toBe(true);
    expect(packApproved(fingerprint, packFingerprint({ ...draft, medications: 'New manual medication' }, [record, undated], 'Synthetic member'))).toBe(false);
  });
  it('includes only explicitly selected records and no AI claims', () => {
    const text = buildPackLines({ ...draft, selectedIds: ['r1'] }, [record, undated, other], 'Synthetic member', '2026-10-28T12:00:00Z').map(l => l.text).join('\n');
    expect(text).toContain('Synthetic report');
    expect(text).not.toContain('Undated report');
    expect(text).not.toContain(record.ai_summary);
    expect(text).toContain('10 Jan 2026');
    expect(text).toContain('5 Feb 2026');
    expect(text).toContain('28 Oct 2026');
  });
});