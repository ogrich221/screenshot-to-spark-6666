import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { PageHeader, Panel, Empty, StatusBadge, btnPrimary, input } from "@/components/admin/ui";
import { issueCard, listIssuedCards, listUsers, setCardStatus } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/cards")({
  head: () => ({ meta: [{ title: "Cards — Lumen Bank Admin" }, { name: "description", content: "Issue and manage customer credit cards." }, { property: "og:title", content: "Cards — Lumen Bank Admin" }, { property: "og:description", content: "Issue and manage customer credit cards." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Page() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: useServerFn(listUsers) });
  const cards = useQuery({ queryKey: ["admin-cards"], queryFn: useServerFn(listIssuedCards) });
  const issue = useServerFn(issueCard);
  const status = useServerFn(setCardStatus);
  const [form, setForm] = useState({ userId: "", cardType: "Physical" as "Physical" | "Virtual", cardholderName: "", creditLimit: "0" });
  const customers = (users.data ?? []).filter((u) => !u.isAdmin);
  const nameOf = (id: string) => { const u = users.data?.find((x) => x.id === id); return u?.name || u?.email || "Unknown user"; };

  const add = useMutation({
    mutationFn: () => issue({ data: { ...form, creditLimit: Number(form.creditLimit) || 0 } }),
    onSuccess: (r) => { if (!r.ok) { toast.error(r.error); return; } toast.success("Card issued."); setForm({ ...form, cardholderName: "", creditLimit: "0" }); qc.invalidateQueries({ queryKey: ["admin-cards"] }); },
    onError: () => toast.error("Check the card details."),
  });
  const change = useMutation({
    mutationFn: (v: { id: string; status: "Active" | "Frozen" | "Cancelled" }) => status({ data: v }),
    onSuccess: (r) => { if (!r.ok) toast.error(r.error); else toast.success("Card updated."); qc.invalidateQueries({ queryKey: ["admin-cards"] }); },
  });

  return <Localized>
    <PageHeader crumbs={[{ label: "Overview", to: "/admin" }, { label: "Cards" }]} title="Cards" sub="Issue physical or virtual credit cards to customers, then freeze or cancel them." />
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Issue a card" className="lg:col-span-1">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <label className="block text-sm">Customer
            <select required className={`${input} mt-1 w-full`} value={form.userId} onChange={(e) => { const u = customers.find((c) => c.id === e.target.value); setForm({ ...form, userId: e.target.value, cardholderName: u?.name || form.cardholderName }); }}>
              <option value="">Choose a customer</option>
              {customers.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select></label>
          <label className="block text-sm">Card type
            <select className={`${input} mt-1 w-full`} value={form.cardType} onChange={(e) => setForm({ ...form, cardType: e.target.value as "Physical" | "Virtual" })}><option value="Physical">Physical card</option><option value="Virtual">Virtual card</option></select></label>
          <label className="block text-sm">Name on card<input required maxLength={100} className={`${input} mt-1 w-full`} value={form.cardholderName} onChange={(e) => setForm({ ...form, cardholderName: e.target.value })} /></label>
          <label className="block text-sm">Credit limit (USD)<input required type="number" min={0} step="0.01" className={`${input} mt-1 w-full`} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} /></label>
          <button disabled={add.isPending || !form.userId} className={`${btnPrimary} w-full`}><CreditCard className="h-4 w-4" />{add.isPending ? "Issuing…" : "Issue card"}</button>
        </form>
      </Panel>
      <Panel title="Issued cards" className="lg:col-span-2">
        {cards.isLoading ? <p className="text-sm text-muted-foreground">Loading cards…</p>
          : !cards.data?.length ? <Empty title="No cards issued yet" text="Issue the first card on the left." />
          : <ul className="divide-y divide-border">{cards.data.map((c) => <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.cardType} card •••• {c.last4} <StatusBadge s={c.status} /></p>
                <p className="truncate text-xs text-muted-foreground"><span data-no-translate>{c.cardholderName}</span> · <span data-no-translate>{nameOf(c.userId)}</span> · exp {c.expires} · limit {money(c.creditLimit)}</p>
              </div>
              {c.status !== "Cancelled" && <div className="flex gap-3 text-sm font-semibold">
                <button className="text-primary" onClick={() => change.mutate({ id: c.id, status: c.status === "Frozen" ? "Active" : "Frozen" })}>{c.status === "Frozen" ? "Unfreeze" : "Freeze"}</button>
                <button className="text-destructive" onClick={() => change.mutate({ id: c.id, status: "Cancelled" })}>Cancel</button>
              </div>}
            </li>)}</ul>}
      </Panel>
    </div>
  </Localized>;
}
