import { Localized } from '@/components/localized';
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Shell, useT } from "@/components/site";
import building from "@/assets/bank-building.jpg";
import staffDesk from "@/assets/staff-desk.jpg";
import manager from "@/assets/branch-manager.jpg";
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, User, ArrowRight } from 'lucide-react';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Bank — Banking, clearly." },
      { name: "description", content: "Simple accounts, transparent fees, and complete control over your money. Lumen Bank: transparent by design." },
      { property: "og:title", content: "Lumen Bank — Banking, clearly." },
      { property: "og:description", content: "Simple accounts, transparent fees, and complete control over your money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useT();
  return (
    <Localized><Shell>
    <div className="relative overflow-hidden min-h-[85vh] flex flex-col justify-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        <img src={building} alt="Lumen Bank headquarters" width={1920} height={1088} className="h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>

      {/* Focused Hero: Only Login to User Profiles & Open an Account */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="size-3.5" />
          <span>Lumen Digital Banking</span>
        </div>

        <h1 className="mt-8 text-5xl font-bold leading-[1.08] sm:text-6xl md:text-7xl text-foreground">
          Welcome to <span className="text-gold">Lumen Bank</span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Access your private profile, manage balances, and send international or domestic transfers with total clarity.
        </p>

        {/* Primary User Actions */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Button asChild size="lg" className="h-14 w-full sm:w-auto min-w-[220px] rounded-full bg-gold px-8 text-base font-semibold shadow-glow hover:brightness-105">
            <Link to="/open-account" className="flex items-center justify-center gap-2">
              Open an account
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-14 w-full sm:w-auto min-w-[220px] rounded-full border-primary/40 bg-secondary/60 px-8 text-base font-semibold hover:bg-secondary">
            <Link to="/auth" className="flex items-center justify-center gap-2">
              <User className="size-4 text-primary" />
              Login to user profile
            </Link>
          </Button>
        </div>

        {/* Security assurance */}
        <div className="mt-16 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="size-4 text-primary" />
            Bank-grade 256-bit encryption
          </span>
          <span>•</span>
          <span>FDIC insured partner accounts</span>
          <span>•</span>
          <span>24/7 human customer support</span>
        </div>
      </section>
    </div>
    </Shell></Localized>
  );
}
