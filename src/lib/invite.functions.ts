import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

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
    const { error: metadataError } = await context.supabase.auth.updateUser({ data: { invite_attribution: null } });
    if (metadataError) throw new Error('Invite counts were removed, but account metadata could not be cleared. Please try again.');
    return { ok: true };
  });