import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { DISCLAIMERS, TIERS } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { welcome?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // RLS returns only published picks for tiers the user is entitled to.
  const { data: pickRows } = await supabase
    .from("picks")
    .select("id, ticker, tier, category, entry_price_reference, strategist_notes, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(25);
  const picks = pickRows ?? [];

  const greetingName =
    profile?.first_name || profile?.email?.split("@")[0] || "there";
  const tierName = sub ? TIERS.find((t) => t.id === sub.tier)?.name ?? sub.tier : null;
  const isActive = sub?.status === "active" || sub?.status === "trialing";

  return (
    <main className="container py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Welcome, {greetingName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tierName ? `You're on ${tierName}.` : "Choose a tier to start getting the daily shortlist."}
          </p>
        </div>
        <SignOutButton />
      </div>

      {searchParams.welcome && isActive && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
          You're in — payment confirmed and your subscription is active. The next
          scouting report will land on your chosen channel.
        </div>
      )}

      {!sub && (
        <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
          <p className="text-muted-foreground">
            No active subscription yet. Choose a tier to start getting the daily
            shortlist.
          </p>
          <Link href="/#pricing" className={buttonVariants({ variant: "accent", size: "sm", className: "mt-3" })}>
            Choose a tier
          </Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Today's picks</h2>

        {picks.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No picks published yet. Check back after the market opens.
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {picks.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{p.ticker}</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {p.category === "buy_today" ? "Buy today" : "Daily alert"}
                  </span>
                </div>
                {p.entry_price_reference != null && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Entry price reference: {p.entry_price_reference}
                  </p>
                )}
                {p.strategist_notes && (
                  <p className="mt-2 text-sm leading-relaxed">{p.strategist_notes}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Educational analysis, not a recommendation. You make the call.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-16 border-t border-border pt-4 text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </footer>
    </main>
  );
}
