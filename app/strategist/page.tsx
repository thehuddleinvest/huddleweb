import { DISCLAIMERS } from "@/lib/tiers";

// Strategist dashboard v0 (§7.1): view ranked shortlist, approve picks, publish.
// Gate behind auth + a strategist role check before wiring real data.
export default function StrategistPage() {
  return (
    <main className="container py-12">
      <h1 className="text-2xl font-medium">Strategist dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review the ranked shortlist, approve picks, and publish to subscribers.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Ranked shortlist</h2>
        <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Connect the <code>rankings</code> table (Modal batch job) to populate this list.
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-4 text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </footer>
    </main>
  );
}
