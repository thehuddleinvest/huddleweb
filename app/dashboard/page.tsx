import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TelegramConnect } from "@/components/dashboard/telegram-connect";
import { PlaybookConnect } from "@/components/dashboard/playbook-connect";
import { PlaybookPnl } from "@/components/dashboard/playbook-pnl";
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
    .select("first_name, email, telegram_chat_id, alpaca_oauth_token_encrypted")
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

  const playbookConnected = !!profile?.alpaca_oauth_token_encrypted;

  // Personal activity — read own rows with the service role (scoped by user id).
  const admin = createAdminClient();
  const { data: tradeRows } = await admin
    .from("trades")
    .select("id, ticker, dollar_amount, status, fill_price, executed_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const trades = tradeRows ?? [];
  const { data: alertRows } = await admin
    .from("notifications")
    .select("id, sent_at, delivered, pick:picks(ticker, category, retracted_at)")
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(20);
  const alertLog = alertRows ?? [];

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

      {sub && <TelegramConnect connected={!!profile?.telegram_chat_id} />}

      {sub?.tier === "drive" && (
        <PlaybookConnect
          connected={!!profile?.alpaca_oauth_token_encrypted}
          telegramConnected={!!profile?.telegram_chat_id}
        />
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

      {sub && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground">Your activity</h2>

          {playbookConnected && (
            <div className="mt-3">
              <PlaybookPnl />
            </div>
          )}

          <div className="mt-3 rounded-xl border border-border">
            <div className="border-b border-border px-4 py-2 text-sm font-medium">Trades</div>
            {trades.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No trades yet. Approve a Playbook alert to place one.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {trades.map((t: {
                  id: string; ticker: string; dollar_amount: number; status: string;
                  fill_price: number | null; created_at: string;
                }) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-16 font-semibold">{t.ticker}</span>
                    <span className="w-16 text-muted-foreground">${Number(t.dollar_amount).toFixed(0)}</span>
                    <span className="flex-1 capitalize text-muted-foreground">{String(t.status).replace(/_/g, " ")}</span>
                    {t.fill_price != null && <span className="text-muted-foreground">fill ${Number(t.fill_price).toFixed(2)}</span>}
                    <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-border">
            <div className="border-b border-border px-4 py-2 text-sm font-medium">Alerts received</div>
            {alertLog.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No alerts yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {alertLog.map((n: {
                  id: string;
                  sent_at: string;
                  delivered: boolean;
                  pick:
                    | { ticker: string; category: string; retracted_at: string | null }
                    | { ticker: string; category: string; retracted_at: string | null }[]
                    | null;
                }) => {
                  const pick = Array.isArray(n.pick) ? n.pick[0] : n.pick;
                  return (
                    <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-16 font-semibold">{pick?.ticker ?? "—"}</span>
                      <span className="flex-1 text-muted-foreground">
                        {pick?.retracted_at ? "Retracted" : pick?.category === "buy_today" ? "Buy today" : "Daily alert"}
                      </span>
                      <span className="text-xs text-muted-foreground">{n.delivered ? "delivered" : "sent"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(n.sent_at).toLocaleDateString()}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      <footer className="mt-16 border-t border-border pt-4 text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </footer>
    </main>
  );
}
