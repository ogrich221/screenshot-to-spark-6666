import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FAQ, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings goals — Lumen Bank" },
      { name: "description", content: "Set savings goals, earn up to 4.1% interest and see exactly how much to put aside each week." },
      { property: "og:title", content: "Save with Lumen Bank" },
      { property: "og:description", content: "Friendly savings goals with a clear plan to reach them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [goal, setGoal] = useState(3000);
  const [months, setMonths] = useState(12);
  const weekly = goal / (months * 4.33);
  return (
    <Shell>
      <PageHero eyebrow="Savings & Goals" title="Savings & goals you can actually see." sub="Name it, date it, and watch it grow—up to 4.1% interest, paid monthly." />
      <section className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-8">
          <h2 className="text-2xl font-semibold">Plan a goal</h2>
          <label htmlFor="goal" className="mt-6 block text-sm font-medium">I want to save <span className="text-primary">${goal.toLocaleString()}</span></label>
          <input id="goal" type="range" min={200} max={20000} step={100} value={goal} onChange={(e) => setGoal(+e.target.value)} className="mt-3 w-full accent-primary" />
          <label htmlFor="months" className="mt-6 block text-sm font-medium">within <span className="text-primary">{months} months</span></label>
          <input id="months" type="range" min={1} max={60} value={months} onChange={(e) => setMonths(+e.target.value)} className="mt-3 w-full accent-primary" />
          <div className="mt-8 rounded-2xl bg-secondary p-6">
            <p className="text-sm text-muted-foreground">Put aside each week</p>
            <p className="font-display text-4xl font-bold text-gold">${weekly.toFixed(2)}</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[["Round-ups", "Spend $3.60 on coffee and we'll save the 40¢ change automatically."], ["Payday boost", "Move a set amount into your goals the moment your salary lands."], ["Withdraw anytime", "It's your money. Take it out whenever you need it—no penalties."]].map(([h, p]) => (
            <div key={h} className="rounded-3xl border border-border p-6">
              <h3 className="text-lg font-semibold text-primary">{h}</h3>
              <p className="mt-2 text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>
      </section>
      <Stats items={[["4.1%", "AER on Plus savings"], ["Monthly", "interest payouts"], ["Unlimited", "savings goals"], ["$0", "withdrawal fees"]]} />
      <FAQ items={[["How is interest calculated?", "Interest is calculated daily on your balance and paid into your goal on the first day of each month."], ["Is my savings money protected?", "Yes. Savings are held in the same protected accounts as your everyday balance."], ["Can I have more than one goal?", "Of course. Create as many goals as you like, each with its own name, target and date."], ["Can I lock a goal?", "Yes. Lock a goal until a chosen date to help you resist temptation."]]} />
    </Shell>
  );
}
