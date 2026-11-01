import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { inviteRetentionInput, invitePurgeInput } from '@/lib/invite-retention';

export const inviteSignupTotals = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc('invite_signup_totals');
    if (error) throw new Error('Invite counts are unavailable.');
    return data ?? [];
  });

export const removeInviteAttribution = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from('invite_signup_attribution').delete().eq('user_id', context.userId);
    if (error) throw new Error('Could not remove your saved invite attribution. Please try again.');
    return { ok: true };
  });

export const getInviteRetention = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (roleError || !allowed) throw new Error('Admins only.');
    const { data, error } = await context.supabase.from('invite_retention_settings').select('retention_days,last_cleanup_at').eq('id', true).maybeSingle();
    if (error) throw new Error('Invite retention settings are unavailable.');
    return { days: data?.retention_days ?? null, lastCleanupAt: data?.last_cleanup_at ?? null };
  });

export const setInviteRetention = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inviteRetentionInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc('set_invite_retention', { _days: data.days as number });
    if (error) throw new Error('Only admins can save a valid invite retention period.');
    const { cleanupInviteAttribution } = await import('@/lib/invite-cleanup.server');
    try { return { saved: true, ...await cleanupInviteAttribution() }; }
    catch { return { saved: true, removed: 0, pending: true }; }
  });

export const purgeInviteAttribution = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => invitePurgeInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc('request_invite_purge', { _older_than_days: data.olderThanDays });
    if (error) throw new Error('Only admins can remove invite attribution.');
    const { cleanupInviteAttribution } = await import('@/lib/invite-cleanup.server');
    try { return { requested: true, ...await cleanupInviteAttribution() }; }
    catch { return { requested: true, removed: 0, pending: true }; }
  });