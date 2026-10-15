import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — FamilyHealth Vault" }] }),
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
    if (error) return toast.error(error.message);
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
    </div>
  );
}
