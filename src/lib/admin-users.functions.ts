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

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignIn: string | null;
  confirmed: boolean;
  accountStatus: string | null;
  isAdmin: boolean;
  balance: number;
  phone: string;
  details: Record<string, unknown>;
};

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error("Could not load users.");
    const ids = data.users.map((u) => u.id);
    const [{ data: accounts }, { data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("customer_accounts").select("user_id,status,available_balance").in("user_id", ids),
      supabaseAdmin.from("user_roles").select("user_id,role").eq("role", "admin"),
      supabaseAdmin.from("profiles").select("id,details").in("id", ids),
    ]);
    return data.users.map((u) => {
      const prof = profiles?.find((p) => p.id === u.id);
      const d = (prof?.details ?? {}) as Record<string, unknown>;
      const profileName = [d["firstName"], d["lastName"]].filter((x) => typeof x === "string" && x).join(" ");
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const acc = accounts?.find((a) => a.user_id === u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        name: profileName || (typeof meta["full_name"] === "string" ? meta["full_name"] : "") || "",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        confirmed: !!u.email_confirmed_at,
        accountStatus: acc?.status ?? null,
        balance: acc ? Number(acc.available_balance) : 0,
        phone: typeof d["phone"] === "string" ? d["phone"] : (typeof meta["phone"] === "string" ? meta["phone"] : ""),
        details: d,
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

export type Txn = { id: string; userId: string; kind: string; amount: number; narration: string; balanceAfter: number | null; createdAt: string; status: string; category: string; details: Record<string, string>; reviewNote: string | null };
const toTxn = (r: { id: string; user_id: string; kind: string; amount: number; narration: string; balance_after: number | null; created_at: string; status: string; category: string; details: unknown; review_note: string | null }): Txn => ({ id: r.id, userId: r.user_id, kind: r.kind, amount: Number(r.amount), narration: r.narration, balanceAfter: r.balance_after == null ? null : Number(r.balance_after), createdAt: r.created_at, status: r.status, category: r.category, details: (r.details ?? {}) as Record<string, string>, reviewNote: r.review_note });

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

const postTxSchema = z.object({
  userId: z.string().uuid(),
  kind: z.enum(["credit", "debit"]),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  narration: z.string().trim().min(1).max(200),
  date: z.string().optional(),
});

export const postTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => postTxSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const amount = Number(data.amount);
    if (!(amount > 0) || amount > 5_000_000) return { ok: false as const, error: "Enter an amount between 0.01 and 5,000,000." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ensure customer account exists (auto-provision if not opened yet)
    let { data: acc } = await supabaseAdmin.from("customer_accounts").select("*").eq("user_id", data.userId).maybeSingle();
    if (!acc) {
      const nowIso = new Date().toISOString();
      const { data: newAcc, error: createAccErr } = await supabaseAdmin
        .from("customer_accounts")
        .insert({
          user_id: data.userId,
          available_balance: 0,
          current_balance: 0,
          status: "Active",
          identity_consent_at: nowIso,
          privacy_version: "1.0",
          terms_version: "1.0",
        })
        .select()
        .single();
      if (createAccErr || !newAcc) {
        return { ok: false as const, error: "Could not initialize customer account: " + (createAccErr?.message || "") };
      }
      acc = newAcc;
    }

    const currentBal = Number(acc.available_balance);
    const delta = data.kind === "credit" ? amount : -amount;
    const newBal = Math.round((currentBal + delta) * 100) / 100;
    if (newBal < 0) return { ok: false as const, error: "Insufficient balance for this debit." };

    const { error: updErr } = await supabaseAdmin
      .from("customer_accounts")
      .update({
        available_balance: newBal,
        current_balance: Math.round((Number(acc.current_balance) + delta) * 100) / 100,
      })
      .eq("id", acc.id);
    if (updErr) return { ok: false as const, error: "Could not update account balance." };

    let txDate = new Date().toISOString();
    if (data.date) {
      const parsed = new Date(data.date);
      if (!isNaN(parsed.getTime())) {
        txDate = parsed.toISOString();
      }
    }

    const { error: insErr } = await supabaseAdmin.from("account_transactions").insert({
      user_id: data.userId,
      account_id: acc.id,
      kind: data.kind,
      amount,
      narration: data.narration.trim(),
      balance_after: newBal,
      created_by: context.userId,
      created_at: txDate,
      status: "completed",
      category: "adjustment",
      details: {},
    });

    if (insErr) return { ok: false as const, error: "Could not record transaction: " + insErr.message };
    return { ok: true as const, balance: newBal };
  });

const updateTxSchema = z.object({
  id: z.string().uuid(),
  narration: z.string().trim().min(1).max(200).optional(),
  date: z.string().optional(),
  kind: z.enum(["credit", "debit"]).optional(),
  status: z.enum(["completed", "pending", "declined"]).optional(),
});

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateTxSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = {};
    if (data.narration !== undefined && data.narration.trim()) patch.narration = data.narration.trim();
    if (data.kind !== undefined) patch.kind = data.kind;
    if (data.status !== undefined) patch.status = data.status;
    if (data.date !== undefined && data.date) {
      const parsed = new Date(data.date);
      if (!isNaN(parsed.getTime())) {
        patch.created_at = parsed.toISOString();
      }
    }

    if (Object.keys(patch).length === 0) return { ok: true as const };

    const { error } = await supabaseAdmin
      .from("account_transactions")
      .update(patch)
      .eq("id", data.id);

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const profileSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(100).optional(),
  dob: z.string().trim().max(50).optional(),
  citizenship: z.string().trim().max(100).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  postal: z.string().trim().max(50).optional(),
  country: z.string().trim().max(100).optional(),
  accountStatus: z.string().trim().max(50).optional(),
});

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch existing profile details
    const { data: prof } = await supabaseAdmin.from("profiles").select("*").eq("id", data.id).maybeSingle();
    const currentDetails = (prof?.details ?? {}) as Record<string, unknown>;

    const updatedDetails: Record<string, unknown> = {
      ...currentDetails,
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.dob !== undefined ? { dob: data.dob } : {}),
      ...(data.citizenship !== undefined ? { citizenship: data.citizenship } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.region !== undefined ? { region: data.region } : {}),
      ...(data.postal !== undefined ? { postal: data.postal } : {}),
      ...(data.country !== undefined ? { country: data.country } : {}),
    };

    const fullName = [
      typeof updatedDetails.firstName === "string" ? updatedDetails.firstName : "",
      typeof updatedDetails.lastName === "string" ? updatedDetails.lastName : "",
    ].filter(Boolean).join(" ");

    // Upsert profile
    const { error: profErr } = await supabaseAdmin.from("profiles").upsert({
      id: data.id,
      details: updatedDetails,
      updated_at: new Date().toISOString(),
    });
    if (profErr) return { ok: false as const, error: "Could not update profile details: " + profErr.message };

    // Update user auth metadata and email
    const authUpdate: { email?: string; user_metadata?: Record<string, unknown> } = {};
    if (data.email) authUpdate.email = data.email;
    if (fullName) authUpdate.user_metadata = { full_name: fullName, phone: data.phone || currentDetails.phone };

    if (Object.keys(authUpdate).length > 0) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(data.id, authUpdate);
      if (authErr) return { ok: false as const, error: "Could not update user auth data: " + authErr.message };
    }

    // Update customer_accounts status
    if (data.accountStatus) {
      const { data: acc } = await supabaseAdmin.from("customer_accounts").select("id").eq("user_id", data.id).maybeSingle();
      if (acc) {
        await supabaseAdmin.from("customer_accounts").update({ status: data.accountStatus }).eq("id", acc.id);
      } else {
        await supabaseAdmin.from("customer_accounts").insert({
          user_id: data.id,
          available_balance: 0,
          current_balance: 0,
          status: data.accountStatus,
          identity_consent_at: new Date().toISOString(),
          privacy_version: "1.0",
          terms_version: "1.0",
        });
      }
    }

    return { ok: true as const };
  });

const detailsSchema = z.record(z.string().max(60), z.string().max(240)).refine((d) => Object.keys(d).length <= 12);

export const requestDebit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ category: z.enum(["bill", "domestic", "international"]), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), narration: z.string().trim().min(1).max(200), details: detailsSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("customer_request_debit", { p_category: data.category, p_amount: Number(data.amount), p_narration: data.narration, p_details: data.details });
    if (error) return { ok: false as const, error: error.message.includes("Insufficient") ? "Insufficient funds." : "Your request could not be submitted. Please try again." };
    return { ok: true as const, id: String(id) };
  });

export const reviewTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().max(200).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { data: status, error } = await context.supabase.rpc("admin_review_transaction", { p_id: data.id, p_approve: data.approve, p_note: data.note });
    if (error) return { ok: false as const, error: /pending|Insufficient/.test(error.message) ? error.message : "Could not review the transaction." };
    return { ok: true as const, status: String(status) };
  });
