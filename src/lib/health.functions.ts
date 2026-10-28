import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { eventSchema, recordDetailsSchema, ownsRelationship, validateDocument, hasDocumentSignature } from './health-rules';

const idSchema = z.object({ id: z.string().uuid() });

export const listHealthEvents = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('health_events').select('*').eq('user_id', context.userId).order('event_date', { ascending: false });
  if (error) throw new Error('Could not load health events.');
  return data;
});
export const listMedicalRecords = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('medical_records').select('*, family_members(member_name)').eq('created_by', context.userId).order('created_at', { ascending: false });
  if (error) throw new Error('Could not load medical records.');
  return data;
});
export const listFamilyMembers = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('family_members').select('*').eq('user_id', context.userId).order('created_at');
  if (error) throw new Error('Could not load family members.');
  return data;
});

export const saveHealthEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => eventSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: member } = await context.supabase.from('family_members').select('user_id').eq('id', data.family_member_id).maybeSingle();
    if (!member || !ownsRelationship(context.userId, member.user_id)) throw new Error('Family member not available.');
    const { id, ...values } = data;
    const query = id
      ? context.supabase.from('health_events').update(values).eq('id', id).eq('user_id', context.userId)
      : context.supabase.from('health_events').insert({ ...values, user_id: context.userId });
    const { data: row, error } = await query.select('id').single();
    if (error || !row) throw new Error('Could not save this event.');
    return { id: row.id };
  });

export const deleteHealthEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from('health_events').delete().eq('id', data.id).eq('user_id', context.userId).select('id').maybeSingle();
    if (error || !row) throw new Error('Could not delete this event.');
    return { ok: true };
  });

export const saveMedicalRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => recordDetailsSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: member } = await context.supabase.from('family_members').select('user_id').eq('id', data.family_member_id).maybeSingle();
    if (!member || !ownsRelationship(context.userId, member.user_id)) throw new Error('Family member not available.');
    const { id, document, ...values } = data;
    if (id) {
      const { data: row, error } = await context.supabase.from('medical_records').update(values).eq('id', id).eq('created_by', context.userId).select('id').single();
      if (error || !row) throw new Error('Could not update this record.');
      return { id: row.id };
    }
    if (!document || !ownsRelationship(context.userId, member.user_id, document)) throw new Error('Document not available.');
    const { data: blob, error: downloadError } = await context.supabase.storage.from('medical-documents').download(document);
    if (downloadError || !blob) throw new Error('Could not verify the uploaded document.');
    const validation = validateDocument({ name: document, size: blob.size, type: blob.type });
    if (validation || !hasDocumentSignature(new Uint8Array(await blob.slice(0, 16).arrayBuffer()), document)) {
      await context.supabase.storage.from('medical-documents').remove([document]);
      throw new Error(validation ?? 'File contents do not match the document type.');
    }
    const { data: row, error } = await context.supabase.from('medical_records').insert({ ...values, document, created_by: context.userId }).select('id').single();
    if (error || !row) throw new Error('Could not save the uploaded record.');
    return { id: row.id };
  });

export const getRecordDocument = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.extend({ download: z.boolean().optional() }).parse(input)).handler(async ({ data, context }) => {
    const { data: record } = await context.supabase.from('medical_records').select('document, name, created_by').eq('id', data.id).eq('created_by', context.userId).maybeSingle();
    if (!record || record.document.split('/')[0] !== context.userId) throw new Error('Record not available.');
    const ext = record.document.split('.').pop()?.toLowerCase() ?? '';
    const { data: signed, error } = await context.supabase.storage.from('medical-documents').createSignedUrl(record.document, 300, data.download ? { download: `${record.name.replace(/[^\p{L}\p{N} _-]/gu, '_')}.${ext}` } : undefined);
    if (error || !signed) throw new Error('Could not open the document.');
    return { url: signed.signedUrl, extension: ext };
  });

export const deleteMedicalRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: record } = await context.supabase.from('medical_records').select('document').eq('id', data.id).eq('created_by', context.userId).maybeSingle();
    if (!record || record.document.split('/')[0] !== context.userId) throw new Error('Record not available.');
    const { error: storageError } = await context.supabase.storage.from('medical-documents').remove([record.document]);
    if (storageError) throw new Error('Could not remove the document; the record has been kept.');
    const { error } = await context.supabase.from('medical_records').delete().eq('id', data.id).eq('created_by', context.userId);
    if (error) throw new Error('The file was removed but the record could not be deleted. Retry deletion.');
    return { ok: true };
  });