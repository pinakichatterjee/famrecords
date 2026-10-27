import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { assertAdminChange } from '@/lib/account-rules';

type AdminContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

async function requireAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Admins only");
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const [{ data: profiles, error }, { data: roles, error: rolesError }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, name, email, created_at, approved")
        .order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw error;
    if (rolesError) throw rolesError;
    const adminIds = new Set(
      (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );
    return (profiles ?? []).map((p) => ({ ...p, is_admin: adminIds.has(p.id) }));
  });

export const setUserApproved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; approved: boolean }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.userId === context.userId && !data.approved) throw new Error("You can't block your own account");
    const { error } = await context.supabase
      .from("profiles")
      .update({ approved: data.approved })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; admin: boolean }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    assertAdminChange(context.userId, data.userId, data.admin);
    if (data.admin) {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && error.code !== "23505") throw error;
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw error;
    }
    return { ok: true };
  });
