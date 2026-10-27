import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordChangeForm } from '@/components/PasswordChangeForm';
import { subscriptionOffer } from '@/lib/account-rules';

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — FamRecords" }, { name: "description", content: "Manage your FamRecords email, password and subscription." }, { property: 'og:title', content: 'Settings — FamRecords' }, { property: 'og:description', content: 'Manage your FamRecords email, password and subscription.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser(
      { email: email.trim() },
      { emailRedirectTo: window.location.origin + "/settings" },
    );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your inbox to confirm the new email address.");
    setEmail("");
  };

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-base text-muted-foreground">Manage your account details.</p>
      </div>
      <form onSubmit={save} className="space-y-6 rounded-xl border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Change email</h2>
          <p className="text-base text-muted-foreground">Current email: <span className="font-medium text-foreground">{user.email}</span></p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ne">New email</Label>
          <Input id="ne" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex justify-center">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Update email"}</Button>
        </div>
      </form>
      <PasswordChangeForm />
      <section className="space-y-3 border-t pt-6">
        <h2 className="text-xl font-semibold">Subscription</h2>
        <p className="text-2xl font-bold">US${subscriptionOffer.amount}</p>
        <p className="text-muted-foreground">Not available yet. Billing period and plan benefits are awaiting confirmation. No payment will be collected.</p>
      </section>
    </div>
  );
}
