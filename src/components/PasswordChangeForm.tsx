import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword } from '@/lib/account-rules';

export function PasswordChangeForm() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = validatePassword(password, confirmation);
    if (invalid) { toast.error(invalid); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password, current_password: current });
      if (error) throw error;
      setCurrent(''); setPassword(''); setConfirmation('');
      toast.success('Password updated.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to change password.'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="space-y-5 border-t pt-6">
    <h2 className="text-xl font-semibold">Change password</h2>
    <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>
    <div className="flex justify-center"><Button disabled={saving}>{saving ? 'Updating…' : 'Update password'}</Button></div>
  </form>;
}