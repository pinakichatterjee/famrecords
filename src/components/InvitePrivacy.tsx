import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { removeInviteAttribution } from '@/lib/invite.functions';
import { onPrivacySetting } from '@/lib/privacy-settings';
import { INVITE_CHOICE_KEY, INVITE_NOTICE, INVITE_NOTICE_TEXT, clearInvite, inviteCampaign, readInviteChoice, saveInvite, signupInvite, type InviteCampaign, type InviteChoice } from '@/lib/invite-attribution';

export function InvitePrivacy() {
  const href = useRouterState({ select: s => s.location.href });
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [choice, setChoice] = useState<InviteChoice | null>(null);
  const [campaign, setCampaign] = useState<InviteCampaign | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = useServerFn(removeInviteAttribution);

  useEffect(() => onPrivacySetting('invite', () => setEditing(true)), []);

  useEffect(() => {
    const read = () => {
      const current = readInviteChoice();
      setChoice(current);
      if (current?.accepted !== true) clearInvite();
      const incoming = inviteCampaign(window.location.href);
      if (incoming && current?.accepted === true) saveInvite(incoming, new Date().toISOString());
      setCampaign(incoming ?? signupInvite());
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [href]);

  async function decide(accepted: boolean) {
    setBusy(true);
    const next = { accepted, notice: INVITE_NOTICE, decidedAt: new Date().toISOString() };
    try {
      localStorage.setItem(INVITE_CHOICE_KEY, JSON.stringify(next));
      setChoice(next);
      if (accepted && campaign) saveInvite(campaign, next.decidedAt);
      if (!accepted) {
        clearInvite();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await remove();
          const { error } = await supabase.auth.updateUser({ data: { invite_attribution: null } });
          if (error) throw error;
        }
      }
      setEditing(false);
    } catch {
      clearInvite();
      toast.error(accepted ? 'Invite measurement could not be saved. You can still create an account.' : 'Future invite measurement is off. If you have an account, sign in and retry to remove saved attribution.');
    } finally { setBusy(false); }
  }

  if (!['/', '/welcome', '/auth', '/privacy'].includes(pathname)) return null;
  if ((!campaign || choice) && !editing) {
    return null;
  }
  return <section aria-label="Optional invite measurement" className="border-t border-border bg-background px-4 py-5">
    <div className="mx-auto max-w-[1200px] space-y-3">
      <h2 className="font-semibold">Optional invite measurement</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">{INVITE_NOTICE_TEXT}</p>
      <a href="/privacy" className="text-sm text-primary underline">Privacy policy</a>
      <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={() => decide(false)}>{choice?.accepted ? 'Withdraw and remove invite attribution' : 'Decline invite measurement'}</Button><Button variant="outline" disabled={busy} onClick={() => decide(true)}>Allow invite measurement</Button></div>
      {pathname === '/privacy' && <p className="text-sm text-muted-foreground">To remove an existing account’s saved invite attribution, sign in before withdrawing. Removal changes invite counts only, not your account or medical records.</p>}
    </div>
  </section>;
}