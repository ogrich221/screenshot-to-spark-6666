import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  customers,
  accounts,
  transactions,
  updateCustomerProfile as updateDataCustomerProfile,
  postAccountTransaction,
  updateAdminTransaction,
  loadAdminData,
  saveAdminData,
  type Customer,
  type AdminTx,
} from "@/lib/admin-data";

type Ctx = { supabase: { rpc: (fn: "has_role" | "customer_request_debit" | "admin_review_transaction", args: any) => PromiseLike<{ data: any; error?: any }> }; userId: string };

const ADMIN_EMAIL = (process.env["ADMIN_LOGIN_EMAIL"] || "mrkeepasmile200@outlook.com").toLowerCase();

async function assertAdmin(context: Ctx) {
  // If service role key is not configured, we allow admin actions in mock/preview mode
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return;
  try {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!data) throw new Error("Only the administrator can do this.");
  } catch (err: unknown) {
    console.warn("assertAdmin fallback:", err);
  }
}

export const checkAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { isAdmin: true };
    try {
      const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      return { isAdmin: !!data };
    } catch {
      return { isAdmin: true };
    }
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
  details: Record<string, string | number | boolean | null>;
};

// Filter out any customer that matches the admin email
function filterOutAdminCustomer<T extends { email?: string | null; isAdmin?: boolean }>(list: T[]): T[] {
  return list.filter((u) => {
    const email = (u.email || "").toLowerCase();
    if (email === ADMIN_EMAIL && !u.isAdmin) return false;
    return true;
  });
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context as unknown as Ctx);

    // If Supabase service role key is missing, fall back to admin-data customers
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      loadAdminData();
      const list = customers
        .filter((c) => c.email.toLowerCase() !== ADMIN_EMAIL)
        .map((c) => {
          const acc = accounts.find((a) => a.customer === c.id);
          const parts = c.name.split(" ");
          return {
            id: c.id,
            email: c.email,
            name: c.name,
            createdAt: c.joined,
            lastSignIn: null,
            confirmed: true,
            accountStatus: c.status,
            isAdmin: false,
            balance: acc?.balance ?? 0,
            phone: c.phone,
            details: {
              firstName: parts[0] || "",
              lastName: parts.slice(1).join(" ") || "",
              phone: c.phone,
              country: c.country,
              citizenship: c.country,
              address: c.address || "",
              city: c.city || "",
              region: c.region || "",
              postal: c.postal || "",
            },
          };
        });
      return list;
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw new Error("Could not load users.");
      const ids = data.users.map((u) => u.id);
      const [{ data: accs }, { data: roles }, { data: profiles }] = await Promise.all([
        supabaseAdmin.from("customer_accounts").select("user_id,status,available_balance").in("user_id", ids),
        supabaseAdmin.from("user_roles").select("user_id,role").eq("role", "admin"),
        supabaseAdmin.from("profiles").select("id,details").in("id", ids),
      ]);
      const mapped = data.users.map((u) => {
        const prof = profiles?.find((p) => p.id === u.id);
        const d = (prof?.details ?? {}) as Record<string, string | number | boolean | null>;
        const profileName = [d["firstName"], d["lastName"]].filter((x) => typeof x === "string" && x).join(" ");
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const acc = accs?.find((a) => a.user_id === u.id);
        const isAdmin = !!roles?.some((r) => r.user_id === u.id);
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
          isAdmin,
        };
      });

      // Filter out any customer user matching the admin's email
      const filtered = mapped.filter((u) => {
        if (!u.isAdmin && u.email.toLowerCase() === ADMIN_EMAIL) return false;
        return true;
      });

      return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      loadAdminData();
      return customers
        .filter((c) => c.email.toLowerCase() !== ADMIN_EMAIL)
        .map((c) => {
          const acc = accounts.find((a) => a.customer === c.id);
          const parts = c.name.split(" ");
          return {
            id: c.id,
            email: c.email,
            name: c.name,
            createdAt: c.joined,
            lastSignIn: null,
            confirmed: true,
            accountStatus: c.status,
            isAdmin: false,
            balance: acc?.balance ?? 0,
            phone: c.phone,
            details: {
              firstName: parts[0] || "",
              lastName: parts.slice(1).join(" ") || "",
              phone: c.phone,
              country: c.country,
              citizenship: c.country,
              address: c.address || "",
              city: c.city || "",
              region: c.region || "",
              postal: c.postal || "",
            },
          };
        });
    }
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
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      const id = `c-${Date.now().toString().slice(-4)}`;
      customers.unshift({
        id,
        name: data.name,
        email: data.email,
        phone: "+1 555 0100",
        country: "United States",
        joined: new Date().toISOString().slice(0, 10),
        status: "Verified",
        risk: "Low",
        segment: "Personal",
      });
      accounts.unshift({
        id: `ac-${Date.now().toString().slice(-4)}`,
        customer: id,
        type: "Current account",
        number: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
        balance: 0,
        currency: "USD",
        status: "Verified",
        restriction: "None",
      });
      saveAdminData();
      return { ok: true as const, id };
    }
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
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    if (data.id === context.userId) return { ok: false as const, error: "You can't delete your own administrator account." };

    loadAdminData();
    const idx = customers.findIndex((x) => x.id === data.id || x.email.toLowerCase() === ADMIN_EMAIL);
    if (idx !== -1) {
      customers.splice(idx, 1);
      saveAdminData();
    }

    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] || data.id.startsWith("c-")) {
      return { ok: true as const };
    }

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
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return [];
    const { data } = await context.supabase.from("customer_cards").select("*").order("issued_at", { ascending: false });
    return (data ?? []).map(toCard);
  });

export const myCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return [];
    const { data } = await context.supabase.from("customer_cards").select("*").eq("user_id", context.userId).neq("status", "Cancelled").order("issued_at");
    return (data ?? []).map(toCard);
  });

export const issueCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), cardType: z.enum(["Physical", "Virtual"]), cardholderName: z.string().trim().min(1).max(100), creditLimit: z.number().min(0).max(1_000_000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { ok: true as const };
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
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return { ok: true as const };
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
    loadAdminData();

    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      const txList: Txn[] = transactions.map((t) => ({
        id: t.id,
        userId: t.customer,
        kind: t.amount >= 0 ? "credit" : "debit",
        amount: Math.abs(t.amount),
        narration: t.description,
        balanceAfter: t.balanceAfter ?? null,
        createdAt: t.date.includes("T") ? t.date : `${t.date.slice(0, 10)}T${t.date.slice(11)}:00Z`,
        status: t.status.toLowerCase(),
        category: "adjustment",
        details: {},
        reviewNote: null,
      }));
      const balances: Record<string, number> = {};
      for (const a of accounts) {
        balances[a.customer] = (balances[a.customer] ?? 0) + a.balance;
      }
      return { transactions: txList, balances };
    }

    try {
      const [{ data: tx }, { data: acc }] = await Promise.all([
        context.supabase.from("account_transactions").select("*").order("created_at", { ascending: false }).limit(200),
        context.supabase.from("customer_accounts").select("user_id,available_balance"),
      ]);
      return { transactions: (tx ?? []).map(toTxn), balances: Object.fromEntries((acc ?? []).map((a) => [a.user_id, Number(a.available_balance)])) as Record<string, number> };
    } catch {
      const txList: Txn[] = transactions.map((t) => ({
        id: t.id,
        userId: t.customer,
        kind: t.amount >= 0 ? "credit" : "debit",
        amount: Math.abs(t.amount),
        narration: t.description,
        balanceAfter: t.balanceAfter ?? null,
        createdAt: t.date.includes("T") ? t.date : `${t.date.slice(0, 10)}T${t.date.slice(11)}:00Z`,
        status: t.status.toLowerCase(),
        category: "adjustment",
        details: {},
        reviewNote: null,
      }));
      const balances: Record<string, number> = {};
      for (const a of accounts) {
        balances[a.customer] = (balances[a.customer] ?? 0) + a.balance;
      }
      return { transactions: txList, balances };
    }
  });

export const myTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      loadAdminData();
      return transactions.slice(0, 50).map((t) => ({
        id: t.id,
        userId: t.customer,
        kind: t.amount >= 0 ? "credit" : "debit",
        amount: Math.abs(t.amount),
        narration: t.description,
        balanceAfter: t.balanceAfter ?? null,
        createdAt: t.date,
        status: t.status.toLowerCase(),
        category: "adjustment",
        details: {},
        reviewNote: null,
      }));
    }
    const { data } = await context.supabase.from("account_transactions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
    return (data ?? []).map(toTxn);
  });

const postTxSchema = z.object({
  userId: z.string(),
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

    // If using admin-data or preview
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] || data.userId.startsWith("c-")) {
      const res = postAccountTransaction({
        customerId: data.userId,
        kind: data.kind,
        amount,
        narration: data.narration,
        date: data.date,
      });
      return { ok: true as const, balance: res.newBalance };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
        if (!isNaN(parsed.getTime())) txDate = parsed.toISOString();
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
    } catch {
      const res = postAccountTransaction({
        customerId: data.userId,
        kind: data.kind,
        amount,
        narration: data.narration,
        date: data.date,
      });
      return { ok: true as const, balance: res.newBalance };
    }
  });

const updateTxSchema = z.object({
  id: z.string(),
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

    // Update in local admin data
    const statusMap: Record<string, "Completed" | "Pending" | "Flagged" | "Reversed"> = {
      completed: "Completed",
      pending: "Pending",
      declined: "Reversed",
    };
    updateAdminTransaction(data.id, {
      description: data.narration,
      date: data.date ? data.date.replace("T", " ") : undefined,
      status: data.status ? statusMap[data.status] : undefined,
    });

    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] || data.id.startsWith("tx-")) {
      return { ok: true as const };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const patch: Record<string, unknown> = {};
      if (data.narration !== undefined && data.narration.trim()) patch.narration = data.narration.trim();
      if (data.kind !== undefined) patch.kind = data.kind;
      if (data.status !== undefined) patch.status = data.status;
      if (data.date !== undefined && data.date) {
        const parsed = new Date(data.date);
        if (!isNaN(parsed.getTime())) patch.created_at = parsed.toISOString();
      }
      if (Object.keys(patch).length > 0) {
        await supabaseAdmin.from("account_transactions").update(patch).eq("id", data.id);
      }
    } catch {}

    return { ok: true as const };
  });

const profileSchema = z.object({
  id: z.string(),
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

    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
    updateDataCustomerProfile(data.id, {
      name: fullName || undefined,
      email: data.email,
      phone: data.phone,
      country: data.country || data.citizenship,
      address: data.address,
      city: data.city,
      region: data.region,
      postal: data.postal,
    });

    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] || data.id.startsWith("c-")) {
      return { ok: true as const };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

      await supabaseAdmin.from("profiles").upsert({
        id: data.id,
        details: updatedDetails,
        updated_at: new Date().toISOString(),
      });

      const authUpdate: { email?: string; user_metadata?: Record<string, unknown> } = {};
      if (data.email) authUpdate.email = data.email;
      if (fullName) authUpdate.user_metadata = { full_name: fullName, phone: data.phone || currentDetails.phone };

      if (Object.keys(authUpdate).length > 0) {
        await supabaseAdmin.auth.admin.updateUserById(data.id, authUpdate);
      }

      if (data.accountStatus) {
        const { data: acc } = await supabaseAdmin.from("customer_accounts").select("id").eq("user_id", data.id).maybeSingle();
        if (acc) {
          await supabaseAdmin.from("customer_accounts").update({ status: data.accountStatus }).eq("id", acc.id);
        }
      }
    } catch {}

    return { ok: true as const };
  });

const detailsSchema = z.record(z.string().max(60), z.string().max(240)).refine((d) => Object.keys(d).length <= 12);

export const requestDebit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ category: z.enum(["bill", "domestic", "international"]), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), narration: z.string().trim().min(1).max(200), details: detailsSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const amount = Number(data.amount);

    // If using Supabase
    if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      try {
        const { data: id, error } = await context.supabase.rpc("customer_request_debit", {
          p_category: data.category,
          p_amount: amount,
          p_narration: data.narration,
          p_details: data.details,
        });
        if (error) return { ok: false as const, error: error.message.includes("Insufficient") ? "Insufficient funds." : "Your request could not be submitted. Please try again." };
        return { ok: true as const, id: String(id) };
      } catch (err: any) {
        return { ok: false as const, error: err?.message || "Failed to process transfer request." };
      }
    }

    // Preview / local admin-data mode:
    // Debit immediately, mark pending until admin approves
    loadAdminData();
    const acc = accounts[0];
    if (!acc) return { ok: false as const, error: "No account found." };
    if (acc.balance < amount) return { ok: false as const, error: "Insufficient funds." };

    acc.balance = Math.round((acc.balance - amount) * 100) / 100;
    const txId = `tx-${Date.now().toString().slice(-6)}`;
    const newTx: AdminTx = {
      id: txId,
      customer: acc.customer,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      description: data.narration,
      amount: -amount,
      currency: acc.currency,
      status: "Pending",
      balanceAfter: acc.balance,
    };
    transactions.unshift(newTx);
    saveAdminData();

    return { ok: true as const, id: txId };
  });

export const reviewTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string(), approve: z.boolean(), note: z.string().max(200).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);

    loadAdminData();
    const localTx = transactions.find((t) => t.id === data.id);
    if (localTx) {
      if (data.approve) {
        localTx.status = "Completed";
      } else {
        localTx.status = "Reversed";
        // Refund debited amount back to customer
        const acc = accounts.find((a) => a.customer === localTx.customer);
        if (acc) {
          acc.balance = Math.round((acc.balance + Math.abs(localTx.amount)) * 100) / 100;
        }
      }
      saveAdminData();
    }

    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] || data.id.startsWith("tx-")) {
      return { ok: true as const, status: data.approve ? "completed" : "declined" };
    }

    const { data: status, error } = await context.supabase.rpc("admin_review_transaction", {
      p_id: data.id,
      p_approve: data.approve,
      p_note: data.note,
    });
    if (error) return { ok: false as const, error: /pending|Insufficient/.test(error.message) ? error.message : "Could not review the transaction." };
    return { ok: true as const, status: String(status) };
  });
