import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, FileText, Settings, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-lockup.png";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/members", label: "Members", icon: Users },
  { to: "/records", label: "Records", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Layout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ["my-admin-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const items = isAdmin
    ? [...nav, { to: "/admin", label: "Admin", icon: ShieldCheck }]
    : [...nav];

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="FamRecords: Rehab & Wellness" className="h-8 w-auto" />
          </Link>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {items.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <Outlet />
      </main>
      <nav
        aria-label="Main"
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden ${
          items.length === 5 ? "grid-cols-5" : "grid-cols-4"
        }`}
      >
        {items.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
