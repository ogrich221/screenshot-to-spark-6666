import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { accounts, cards, cases, alerts, transactions, customerById, money } from "@/lib/admin-data";
import { DataPage, CustomerLink } from "@/components/admin/DataPage";
import { PageHeader, Panel, StatusBadge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Lumen Bank Admin" }, { name: "description", content: "Workspace and security settings." }, { property: "og:title", content: "Settings — Lumen Bank Admin" }, { property: "og:description", content: "Workspace and security settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const items = [["Two-step sign-in", "Require a code from your authenticator app", true], ["Session timeout", "Sign out after 15 minutes of inactivity", true], ["Large transaction alerts", "Notify me about payments over $25,000", true], ["Daily summary email", "Send the overview every morning at 07:00", false]] as const;
  return (
    <>
      <PageHeader crumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Settings" }]} back={{ label: "Back to dashboard", to: "/admin" }} title="Settings" sub="Your profile, security and notifications." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Profile">
          <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-lg font-semibold text-primary-foreground">AR</span><div><p className="font-semibold">Alex Rivera</p><p className="text-sm text-muted-foreground">Administrator · alex.rivera@lumenbank.com</p></div></div>
          <p className="mt-4 text-sm text-muted-foreground">Sole administrator with full access to every area of the workspace.</p>
        </Panel>
        <Panel title="Security & notifications" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {items.map(([t, d, on]) => (
              <li key={t} className="flex items-center justify-between gap-4 py-4">
                <div><p className="font-medium">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
                <label className="relative inline-flex cursor-pointer items-center"><span className="sr-only">{t}</span>
                  <input type="checkbox" defaultChecked={on} className="peer sr-only" onChange={(e) => toast.success(`${t} ${e.target.checked ? "turned on" : "turned off"}`)} />
                  <span className="h-7 w-12 rounded-full bg-muted transition peer-checked:bg-gold" /><span className="absolute left-1 h-5 w-5 rounded-full bg-foreground transition peer-checked:translate-x-5" />
                </label>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Need help?" className="lg:col-span-3">
          <p className="text-sm text-muted-foreground">New to the workspace? Every page has a breadcrumb at the top and a back button. Info icons explain what each number means. Most actions can be undone from the message that appears afterwards.</p>
        </Panel>
      </div>
    </>
  );
}
