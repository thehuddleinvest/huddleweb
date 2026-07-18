import { DISCLAIMERS } from "@/lib/tiers";

// Subscriber dashboard v0 (§7.1). Wire to Supabase auth + `picks` table next.
export default function DashboardPage() {
  return (
    <main className="container py-12">
      <h1 className="text-2xl font-medium">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here are today’s picks for your tier.</p>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Today’s picks</h2>
        <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No picks published yet today. Check back after the market opens.
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-4 text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </footer>
    </main>
  );
}
