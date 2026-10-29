import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword } from '@/lib/account-rules';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Reset password — FamRecords' },
    { name: 'description', content: 'Securely reset your FamRecords account password.' },
    { property: 'og:title', content: 'Reset password — FamRecords' },
    { property: 'og:description', content: 'Securely reset your FamRecords account password.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }), component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('Checking your reset link…');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
    if (!recovery) { setMessage('Open the password reset link from your email.'); return; }
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) { setMessage('This reset link has expired. Request a new one.'); return; }
      setReady(true); setMessage('');
    });
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = validatePassword(password, confirmation);
    if (invalid) { setMessage(invalid); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true); setReady(false); setPassword(''); setConfirmation(''); setMessage('Your password has been reset.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to reset password.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-md space-y-6 px-4 py-12">
    <h1 className="text-3xl font-bold">Reset password</h1>
    {message && <p role="status" className="text-muted-foreground">{message}</p>}
    {ready && !done && <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="reset-password">New password</Label><Input id="reset-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="reset-confirm">Confirm new password</Label><Input id="reset-confirm" type="password" required autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>
      <Button className="w-full" disabled={busy}>{busy ? 'Updating…' : 'Set new password'}</Button>
    </form>}
    <Button asChild variant="outline"><Link to="/auth">Back to sign in</Link></Button>
  </main>;
}