import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listUsers, setUserAdmin, setUserApproved } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — FamRecords" },
      { name: "description", content: "Approve new FamRecords users and manage admins." },
      { property: 'og:title', content: 'Admin — FamRecords' },
      { property: 'og:description', content: 'Approve new FamRecords users and manage admins.' },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const approveFn = useServerFn(setUserApproved);
  const adminFn = useServerFn(setUserAdmin);

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["my-admin-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers({ data: {} }),
    enabled: isAdmin === true,
  });

  const refresh = () => queryClient.invalidateQueries();

  const toggleApproved = async (userId: string, approved: boolean) => {
    try {
      await approveFn({ data: { userId, approved } });
      toast.success(approved ? "User approved." : "Approval removed.");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const toggleAdmin = async (userId: string, admin: boolean) => {
    try {
      await adminFn({ data: { userId, admin } });
      toast.success(admin ? "Admin access granted." : "Admin access removed.");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (checkingRole) {
    return <p className="text-base text-muted-foreground">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-2 rounded-xl border bg-card p-8 text-center shadow-soft">
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="text-base text-muted-foreground">
          This page is only available to FamRecords admins.
        </p>
      </div>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-base text-muted-foreground">
          Approve new sign-ups and manage who can use FamRecords.
        </p>
      </div>
      {usersQuery.isPending && <p role="status">Loading users…</p>}
      {usersQuery.isError && <div role="alert" className="space-y-3 text-destructive"><p>{usersQuery.error.message}</p><Button variant="outline" onClick={() => usersQuery.refetch()}>Try again</Button></div>}
      <section className="space-y-2 border-t pt-4"><h2 className="text-xl font-semibold">Subscriptions</h2><p className="text-muted-foreground">US$29 plan pending billing period, benefits and payment setup. No paid subscriptions have been enabled.</p></section>
      <section className="space-y-2 border-t pt-4"><h2 className="text-xl font-semibold">Visitors</h2><p className="text-muted-foreground">Visitor totals are not connected to this panel yet.</p></section>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-soft">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b text-sm text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{u.name ?? "—"}</td>
                <td className="px-4 py-3">{u.email ?? "—"}</td>
                <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.approved ? (
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-primary">
                      Approved
                    </span>
                  ) : (
                    <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{u.is_admin ? "Admin" : "User"}</td>
                <td className="space-x-2 px-4 py-3">
                  <Button
                    size="sm"
                    variant={u.approved ? "outline" : "default"}
                    disabled={u.id === user.id}
                    onClick={() => toggleApproved(u.id, !u.approved)}
                  >
                    {u.approved ? "Remove approval" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={u.id === user.id}
                    onClick={() => toggleAdmin(u.id, !u.is_admin)}
                  >
                    {u.is_admin ? "Remove admin" : "Make admin"}
                  </Button>
                </td>
              </tr>
            ))}
            {usersQuery.isSuccess && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
