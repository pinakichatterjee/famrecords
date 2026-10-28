import { z } from 'zod';

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const extensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'gif'];
export function validateDocument(file: { name: string; size: number; type: string }) {
  if (!file.size) return 'Choose a non-empty document.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Documents must be 20 MB or smaller.';
  if (!extensions.includes(file.name.split('.').pop()?.toLowerCase() ?? '')) return 'Choose a PDF, Word, JPG, PNG, WEBP or GIF file.';
  if (file.type && !DOCUMENT_MIME_TYPES.includes(file.type)) return 'This document type is not supported.';
  return null;
}
export function hasDocumentSignature(bytes: Uint8Array, path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  const starts = (...values: number[]) => values.every((v, i) => bytes[i] === v);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length));
  if (ext === 'pdf') return ascii(0, 5) === '%PDF-';
  if (ext === 'doc') return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  if (ext === 'docx') return starts(0x50, 0x4b, 0x03, 0x04);
  if (ext === 'png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (ext === 'jpg' || ext === 'jpeg') return starts(0xff, 0xd8, 0xff);
  if (ext === 'gif') return ['GIF87a', 'GIF89a'].includes(ascii(0, 6));
  if (ext === 'webp') return ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP';
  return false;
}
export function ownsRelationship(ownerId: string, memberOwnerId: string, document?: string) {
  return ownerId === memberOwnerId && (document === undefined || document.split('/')[0] === ownerId);
}
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Choose a valid date.');
export const eventSchema = z.object({
  id: z.string().uuid().optional(), family_member_id: z.string().uuid(),
  event_type: z.enum(['appointment', 'health_event']), title: z.string().trim().min(1).max(200),
  event_date: dateSchema, event_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  provider: z.string().trim().max(300).nullable(), notes: z.string().trim().max(5000).nullable(),
});
export type EventInput = z.infer<typeof eventSchema>;
export const recordDetailsSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(1).max(200),
  family_member_id: z.string().uuid(), visit_date: dateSchema.nullable(),
  provider: z.string().trim().max(300).nullable(), record_type: z.string().max(100).nullable(),
  document: z.string().max(500).optional(),
});