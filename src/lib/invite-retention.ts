import { z } from 'zod';

export const INVITE_RETENTION_OPTIONS = [30, 90, 180, 365] as const;
export const inviteRetentionInput = z.object({ days: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365), z.null()]) });
export const invitePurgeInput = z.object({ olderThanDays: z.union([z.literal(0), z.literal(30), z.literal(90)]), confirmed: z.literal(true) });

export function inviteExpired(createdAt: string, days: number | null, now: number, purgeBefore: string | null = null) {
  const created = Date.parse(createdAt);
  return (purgeBefore !== null && created <= Date.parse(purgeBefore)) || (days !== null && created <= now - days * 86_400_000);
}

// Metadata must be cleared first: a failed API call leaves a row for safe retry.
export async function deleteInviteCopies(
  clearMetadata: () => Promise<void>,
  deleteRow: () => Promise<void>,
) {
  await clearMetadata();
  await deleteRow();
}