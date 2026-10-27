import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Only the administrator can do this.");
}

export const checkAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export type AdminUser = { id: string; email: string; name: string; createdAt: string; lastSignIn: string | null; confirmed: boolean; accountStatus: string | null; isAdmin: boolean };

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error("Could not load users.");
    const ids = data.users.map((u) => u.id);
    const [{ data: accounts }, { data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("customer_accounts").select("user_id,status").in("user_id", ids),
      supabaseAdmin.from("user_roles").select("user_id,role").eq("role", "admin"),
      supabaseAdmin.from("profiles").select("id,details").in("id", ids),
    ]);
    return data.users.map((u) => {
      const d = (profiles?.find((p) => p.id === u.id)?.details ?? {}) as Record<string, unknown>;
      const profileName = [d.firstName, d.lastName].filter((x) => typeof x === "string" && x).join(" ");
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      return {
        id: u.id,
        email: u.email ?? "",
        name: profileName || (typeof meta.full_name === "string" ? meta.full_name : "") || "",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        confirmed: !!u.email_confirmed_at,
        accountStatus: accounts?.find((a) => a.user_id === u.id)?.status ?? null,
        isAdmin: !!roles?.some((r) => r.user_id === u.id),
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (error || !res.user) return { ok: false as const, error: error?.message.includes("already") ? "A user with this email already exists." : "Could not create the user." };
    return { ok: true as const, id: res.user.id };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    if (data.id === context.userId) return { ok: false as const, error: "You can't delete your own administrator account." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("customer_security").delete().eq("user_id", data.id);
    await supabaseAdmin.from("customer_accounts").delete().eq("user_id", data.id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) return { ok: false as const, error: "Could not delete the user." };
    return { ok: true as const };
  });
