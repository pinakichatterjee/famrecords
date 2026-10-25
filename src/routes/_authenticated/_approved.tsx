import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_approved")({
  component: ApprovedGate,
});

function ApprovedGate() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-approval"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data: profile } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", u.user.id)
        .maybeSingle();
      return profile?.approved === true;
    },
  });

  if (isLoading) {
    return <p className="text-base text-muted-foreground">Loading…</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Your account is waiting for approval</h1>
        <p className="text-base text-muted-foreground">
          An admin needs to approve your account before you can add family members or medical
          records. You'll be able to use FamRecords as soon as that's done — no need to sign up
          again.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
