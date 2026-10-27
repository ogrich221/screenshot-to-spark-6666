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
      const profileName = [d["firstName"], d["lastName"]].filter((x) => typeof x === "string" && x).join(" ");
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      return {
        id: u.id,
        email: u.email ?? "",
        name: profileName || (typeof meta["full_name"] === "string" ? meta["full_name"] : "") || "",
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

export type IssuedCard = { id: string; userId: string; cardType: string; cardholderName: string; last4: string; expires: string; creditLimit: number; status: string; issuedAt: string };
const toCard = (r: { id: string; user_id: string; card_type: string; cardholder_name: string; last4: string; expires: string; credit_limit: number; status: string; issued_at: string }): IssuedCard => ({ id: r.id, userId: r.user_id, cardType: r.card_type, cardholderName: r.cardholder_name, last4: r.last4, expires: r.expires, creditLimit: Number(r.credit_limit), status: r.status, issuedAt: r.issued_at });

export const listIssuedCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { data } = await context.supabase.from("customer_cards").select("*").order("issued_at", { ascending: false });
    return (data ?? []).map(toCard);
  });

export const myCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("customer_cards").select("*").eq("user_id", context.userId).neq("status", "Cancelled").order("issued_at");
    return (data ?? []).map(toCard);
  });

export const issueCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), cardType: z.enum(["Physical", "Virtual"]), cardholderName: z.string().trim().min(1).max(100), creditLimit: z.number().min(0).max(1_000_000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("id", data.userId).maybeSingle();
    if (!profile) return { ok: false as const, error: "This user has no profile yet." };
    const rnd = new Uint32Array(1); crypto.getRandomValues(rnd);
    const now = new Date();
    const expires = `${String(now.getUTCMonth() + 1).padStart(2, "0")}/${String((now.getUTCFullYear() + 4) % 100).padStart(2, "0")}`;
    const { error } = await supabaseAdmin.from("customer_cards").insert({ user_id: data.userId, card_type: data.cardType, cardholder_name: data.cardholderName, last4: String((rnd[0] ?? 0) % 10000).padStart(4, "0"), expires, credit_limit: data.creditLimit });
    if (error) return { ok: false as const, error: "Could not issue the card." };
    return { ok: true as const };
  });

export const setCardStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["Active", "Frozen", "Cancelled"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("customer_cards").update({ status: data.status }).eq("id", data.id);
    return error ? { ok: false as const, error: "Could not update the card." } : { ok: true as const };
  });

export type Txn = { id: string; userId: string; kind: string; amount: number; narration: string; balanceAfter: number; createdAt: string };
const toTxn = (r: { id: string; user_id: string; kind: string; amount: number; narration: string; balance_after: number; created_at: string }): Txn => ({ id: r.id, userId: r.user_id, kind: r.kind, amount: Number(r.amount), narration: r.narration, balanceAfter: Number(r.balance_after), createdAt: r.created_at });

export const listLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const [{ data: tx }, { data: acc }] = await Promise.all([
      context.supabase.from("account_transactions").select("*").order("created_at", { ascending: false }).limit(200),
      context.supabase.from("customer_accounts").select("user_id,available_balance"),
    ]);
    return { transactions: (tx ?? []).map(toTxn), balances: Object.fromEntries((acc ?? []).map((a) => [a.user_id, Number(a.available_balance)])) as Record<string, number> };
  });

export const myTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("account_transactions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
    return (data ?? []).map(toTxn);
  });

export const postTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), kind: z.enum(["credit", "debit"]), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), narration: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const amount = Number(data.amount);
    if (!(amount > 0) || amount > 5_000_000) return { ok: false as const, error: "Enter an amount between 0.01 and 5,000,000." };
    const { data: bal, error } = await context.supabase.rpc("admin_post_transaction", { p_user_id: data.userId, p_kind: data.kind, p_amount: amount, p_narration: data.narration });
    if (error) return { ok: false as const, error: /no opened account|Insufficient/.test(error.message) ? error.message : "Could not post the transaction." };
    return { ok: true as const, balance: Number(bal) };
  });

export const payBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ type: z.enum(["Electricity", "Water", "Gas", "Internet & phone"]), provider: z.string().trim().min(1).max(120), reference: z.string().trim().min(1).max(100), amount: z.string().regex(/^\d+(\.\d{1,2})?$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("customer_pay_bill", { p_type: data.type, p_provider: data.provider, p_reference: data.reference, p_amount: Number(data.amount) });
    if (error) return { ok: false as const, error: error.message.includes("Insufficient") ? "Insufficient funds. No money was sent." : "The bill could not be paid. Please try again." };
    const r = res as { id: string; balance: number };
    return { ok: true as const, id: r.id, balance: Number(r.balance) };
  });
