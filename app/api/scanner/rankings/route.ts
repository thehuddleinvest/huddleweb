import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIERS } from "@/lib/tiers";

export const runtime = "nodejs";

interface RankingItem {
  cluster?: string;
  ticker?: string;
  rank?: number;
  score?: number;
  signals?: Record<string, unknown>;
}

// The scanner POSTs its ranked shortlist here. Protected by a shared secret.
// Replaces the current shortlist for the given run_type with the new snapshot.
export async function POST(req: Request) {
  const secret = process.env.SCANNER_INGEST_SECRET;
  const got = req.headers.get("x-scanner-secret");
  if (!secret || got !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    run_type?: string;
    tier?: string;
    run_date?: string;
    rankings?: RankingItem[];
  };

  const runType = body.run_type === "daily" ? "daily" : "weekly";
  const tier = TIERS.find((t) => t.id === body.tier)?.id ?? "kickoff";
  const runDate = body.run_date ?? new Date().toISOString().slice(0, 10);
  const items = Array.isArray(body.rankings) ? body.rankings : [];

  const rows = items
    .filter((r) => r.cluster && r.ticker && typeof r.rank === "number")
    .map((r) => ({
      run_date: runDate,
      run_type: runType,
      cluster: String(r.cluster),
      ticker: String(r.ticker).toUpperCase(),
      tier,
      rank: r.rank as number,
      score: r.score ?? null,
      signals: r.signals ?? null,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rankings." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Replace the prior snapshot for this run_type so the shortlist is current.
  await admin.from("rankings").delete().eq("run_type", runType);
  const { error } = await admin.from("rankings").insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length, run_type: runType });
}
