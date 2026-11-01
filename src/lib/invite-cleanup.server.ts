import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { deleteInviteCopies } from '@/lib/invite-retention';

export async function cleanupInviteAttribution() {
  const { data: rows, error } = await supabaseAdmin.rpc('invite_cleanup_candidates');
  if (error) throw new Error('Invite cleanup could not start.');
  let removed = 0;
  let failed = 0;
  await Promise.all((rows ?? []).map(async row => {
    try {
      await deleteInviteCopies(async () => {
        const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, { user_metadata: { invite_attribution: null } });
        if (metadataError) throw new Error('Invite metadata cleanup failed.');
      }, async () => {
        const { error: deleteError } = await supabaseAdmin.from('invite_signup_attribution').delete().eq('user_id', row.user_id).eq('created_at', row.created_at);
        if (deleteError) throw new Error('Invite count cleanup failed.');
      });
      removed += 1;
    } catch { failed += 1; }
  }));
  if (failed === 0) {
    await supabaseAdmin.from('invite_retention_settings').update({ last_cleanup_at: new Date().toISOString() }).eq('id', true);
  }
  return { removed, pending: failed > 0 || (rows?.length ?? 0) === 20 };
}