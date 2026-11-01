import { describe, it, expect, vi } from 'vitest';
import { inviteRetentionInput, invitePurgeInput, inviteExpired, deleteInviteCopies } from '@/lib/invite-retention';

describe('invite retention', () => {
  it.each([30,90,180,365,null])('accepts configured retention %s', days => {
    expect(inviteRetentionInput.parse({ days }).days).toBe(days);
  });
  it.each([0,1,-30,366,'30'])('rejects invalid retention %s', days => {
    expect(inviteRetentionInput.safeParse({ days }).success).toBe(false);
  });
  it('expires at the boundary using account capture time', () => {
    const now = Date.parse('2026-11-01T05:46:00Z');
    expect(inviteExpired('2026-10-02T05:46:00Z',30,now)).toBe(true);
    expect(inviteExpired('2026-10-02T05:46:01Z',30,now)).toBe(false);
    expect(inviteExpired('2025-01-01T00:00:00Z',null,now)).toBe(false);
  });
  it('early deletion affects existing captures but not future captures', () => {
    const cutoff = '2026-11-01T05:46:00Z';
    expect(inviteExpired(cutoff,null,Date.parse(cutoff),cutoff)).toBe(true);
    expect(inviteExpired('2026-11-01T05:46:01Z',null,Date.parse(cutoff),cutoff)).toBe(false);
  });
  it('requires explicit confirmation for deletion', () => {
    expect(invitePurgeInput.safeParse({ olderThanDays: 0 }).success).toBe(false);
    expect(invitePurgeInput.safeParse({ olderThanDays: 0, confirmed: false }).success).toBe(false);
    expect(invitePurgeInput.parse({ olderThanDays: 0, confirmed: true }).olderThanDays).toBe(0);
    expect(invitePurgeInput.safeParse({ olderThanDays: 1, confirmed: true }).success).toBe(false);
  });
  it('keeps reporting rows for retry when metadata cleanup fails', async () => {
    const remove = vi.fn();
    await expect(deleteInviteCopies(async () => { throw new Error('retry'); },remove)).rejects.toThrow('retry');
    expect(remove).not.toHaveBeenCalled();
  });
  it('clears metadata before deleting reporting attribution', async () => {
    const order: string[] = [];
    await deleteInviteCopies(async () => { order.push('metadata'); },async () => { order.push('attribution'); });
    expect(order).toEqual(['metadata','attribution']);
  });
});