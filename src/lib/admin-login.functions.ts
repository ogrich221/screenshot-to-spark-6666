import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const same = async (a: string, b: string) => {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const p = new Uint8Array(x), q = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < p.length; i++) diff |= (p[i] ?? 0) ^ (q[i] ?? 0);
  return diff === 0;
};

/** Passcode-only administrator sign-in; returns a normal session only for the configured administrator. */
export const adminPasscodeLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(128) }).parse(d))
  .handler(async ({ data }) => {
    const passcode = process.env["ADMIN_INITIAL_PASSCODE"], email = process.env["ADMIN_LOGIN_EMAIL"];
    if (!passcode || !email) return { ok: false as const, error: "Administrator sign-in is not set up." };
    if (!(await same(data.passcode, passcode))) {
      await new Promise((r) => setTimeout(r, 700));
      return { ok: false as const, error: "Incorrect passcode." };
    }
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
    });
    let res = await client.auth.signInWithPassword({ email, password: passcode });
    if (res.error) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: role } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
      if (!role) return { ok: false as const, error: "Administrator account not found." };
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
      if (u.user?.email?.toLowerCase() !== email.toLowerCase()) return { ok: false as const, error: "Administrator account not found." };
      await supabaseAdmin.auth.admin.updateUserById(role.user_id, { password: passcode });
      res = await client.auth.signInWithPassword({ email, password: passcode });
    }
    if (res.error || !res.data.session) return { ok: false as const, error: "Could not sign in. Please try again." };
    return { ok: true as const, accessToken: res.data.session.access_token, refreshToken: res.data.session.refresh_token };
  });
