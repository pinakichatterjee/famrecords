import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { getInviteRetention, setInviteRetention, purgeInviteAttribution } from '@/lib/invite.functions';
import { INVITE_RETENTION_OPTIONS, inviteRetentionInput, invitePurgeInput } from '@/lib/invite-retention';

export function InviteRetentionSettings() {
  const getSettings = useServerFn(getInviteRetention);
  const saveSettings = useServerFn(setInviteRetention);
  const purge = useServerFn(purgeInviteAttribution);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['invite-retention-settings'], queryFn: () => getSettings() });
  const [selection, setSelection] = useState<string | null>(null);
  const [scope, setScope] = useState('30');
  const [confirm, setConfirm] = useState<'save' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const value = selection ?? (query.data?.days === null ? 'until_deleted' : String(query.data?.days ?? 'until_deleted'));
  const apply = async () => {
    setBusy(true);
    try {
      const result = confirm === 'save'
        ? await saveSettings({ data: inviteRetentionInput.parse({ days: value === 'until_deleted' ? null : Number(value) }) })
        : await purge({ data: invitePurgeInput.parse({ olderThanDays: Number(scope), confirmed: true }) });
      toast.success(result.pending ? 'Saved. Invite counts are updated; remaining deletion will retry automatically.' : confirm === 'save' ? 'Retention saved. Expired invite data removed.' : 'Selected invite attribution removed.');
      setConfirm(null);
      setSelection(null);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['invite-retention-settings'] }), queryClient.invalidateQueries({ queryKey: ['admin-invite-signups'] })]);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <section aria-label="Invite attribution retention" className="space-y-4 border-t border-border pt-4">
    <h3 className="text-lg font-semibold">Invite attribution retention</h3>
    <p className="text-sm text-muted-foreground">Applies to saved invite labels and consent details for all accounts, not medical records or accounts. Deleted attribution cannot be restored, and grouped sign-up counts will decrease.</p>
    {query.isPending && <p role="status">Loading retention settings…</p>}
    {query.isError && <div role="alert"><p>Retention settings could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Retry retention settings</Button></div>}
    {query.isSuccess && <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs space-y-2"><label htmlFor="invite-retention" className="text-sm font-medium">Keep saved invite attribution</label><Select value={value} onValueChange={setSelection} disabled={busy}><SelectTrigger id="invite-retention"><SelectValue /></SelectTrigger><SelectContent>{INVITE_RETENTION_OPTIONS.map(days => <SelectItem key={days} value={String(days)}>{days} days after sign-up</SelectItem>)}<SelectItem value="until_deleted">Until account deletion or withdrawal</SelectItem></SelectContent></Select></div>
        <Button variant="outline" disabled={busy || selection === null} onClick={() => setConfirm('save')}>Save retention</Button>
      </div>
      <p className="text-sm text-muted-foreground">Expired attribution stops appearing in counts immediately. Automatic deletion runs every five minutes in batches, clearing saved account labels first. Longer periods do not restore deleted data. Pending invite labels in a browser tab still expire after 24 hours.</p>
      {query.data.lastCleanupAt && <p className="text-sm text-muted-foreground">Last successful cleanup: {new Date(query.data.lastCleanupAt).toLocaleString()}</p>}
      <div className="flex flex-wrap items-end gap-3"><div className="w-full max-w-xs space-y-2"><label htmlFor="invite-delete-scope" className="text-sm font-medium">Delete earlier</label><Select value={scope} onValueChange={setScope} disabled={busy}><SelectTrigger id="invite-delete-scope"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">Attribution older than 30 days</SelectItem><SelectItem value="90">Attribution older than 90 days</SelectItem><SelectItem value="0">All currently saved attribution</SelectItem></SelectContent></Select></div><Button variant="outline" disabled={busy} onClick={() => setConfirm('delete')}>Delete invite data…</Button></div>
      <p className="text-sm text-muted-foreground">Early deletion does not change the retention setting or block future consented sign-ups.</p>
    </>}
    <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open && !busy) setConfirm(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm === 'save' ? 'Save invite retention?' : 'Delete invite attribution?'}</AlertDialogTitle><AlertDialogDescription>{confirm === 'save' ? `Keep attribution ${value === 'until_deleted' ? 'until account deletion or withdrawal' : `for ${value} days after sign-up`}. This applies to existing and future sign-ups; any expired data will be deleted.` : `Permanently remove ${scope === '0' ? 'all currently saved invite attribution' : `invite attribution older than ${scope} days`}. Accounts and medical records will not change; deleted counts cannot be recovered.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><Button disabled={busy} onClick={apply}>{busy ? 'Applying…' : confirm === 'save' ? 'Confirm retention' : 'Confirm deletion'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}