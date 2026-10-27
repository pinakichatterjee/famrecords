import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-lockup.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prepareSignupMeasurement } from '@/lib/signup-tracking';

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create a free account — FamRecords" },
      { name: "description", content: "Create your free FamRecords account or sign in to see your family's medical records, reports and prescriptions." },
      { property: "og:title", content: "Sign in or create a free account — FamRecords" },
      { property: "og:description", content: "Create your free FamRecords account or sign in to see your family's medical records, reports and prescriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/reset-password' });
        if (error) throw error;
        toast.success('If an account exists for that email, a reset link will be sent.');
        return;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { name } },
        });
        if (error) throw error;
        prepareSignupMeasurement(Boolean(data.user && (data.user.identities?.length ?? 0) > 0));
        if (data.session) navigate({ to: "/dashboard" });
        else toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-card p-8 shadow-soft">
        <div className="flex items-center gap-2">
          <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-10 w-auto" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{mode === 'forgot' ? 'Forgot password' : mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-base text-muted-foreground">
            {mode === 'forgot' ? 'Receive a password reset link by email.' : mode === "signin" ? "Sign in to your family's records." : "Start organising your family's health."}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== 'forgot' && <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Please wait…" : mode === 'forgot' ? 'Send reset link' : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <Button variant="link" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create an account" : "Sign in"}
          </Button>
        </p>
        {mode === 'signin' && <div className="flex justify-center"><Button variant="link" onClick={() => setMode('forgot')}>Forgot password?</Button></div>}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
