import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrategist } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  StrategistConsole,
  type Pick,
  type Ranking,
} from "@/components/strategist/strategist-console";
import { DISCLAIMERS } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function StrategistPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/strategist");
  if (!isStrategist(user.email)) redirect("/dashboard");

  // Strategist sees all picks (drafts + published, minus soft-deleted) and the
  // scanner shortlist — read with service role.
  const admin = createAdminClient();
  const { data } = await admin
    .from("picks")
    .select(
      "id, tier, ticker, category, entry_price_reference, strategist_notes, published_at, retracted_at, created_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const picks = (data ?? []) as Pick[];

  const { data: rankData } = await admin
    .from("rankings")
    .select("cluster, ticker, rank, score, signals, tier")
    .order("cluster", { ascending: true })
    .order("rank", { ascending: true });
  const rankings = (rankData ?? []) as Ranking[];

  return (
    <main className="container py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Strategist console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create picks, then publish to send them to subscribers of that tier.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8">
        <StrategistConsole initialPicks={picks} rankings={rankings} />
      </div>

      <footer className="mt-16 border-t border-border pt-4 text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </footer>
    </main>
  );
}
