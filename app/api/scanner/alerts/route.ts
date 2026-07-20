import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface AlertItem {
  detected_at?: string;
  symbol?: string;
  cluster?: string;
  setup_type?: string;
  price?: number;
  score?: number;
  details?: Record<string, unknown>;
}

// The scanner posts intraday setups here (batch). Appends to the alerts log.
export async function POST(req: Request) {
  const secret = process.env.SCANNER_INGEST_SECRET;
  if (!secret || req.headers.get("x-scanner-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { alerts?: AlertItem[] };
  const items = Array.isArray(body.alerts) ? body.alerts : [];

  const rows = items
    .filter((a) => a.symbol && a.setup_type)
    .map((a) => ({
      detected_at: a.detected_at ?? new Date().toISOString(),
      symbol: String(a.symbol).toUpperCase(),
      cluster: a.cluster ?? null,
      setup_type: String(a.setup_type),
      price: a.price ?? null,
      score: a.score ?? null,
      details: a.details ?? null,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid alerts." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("scanner_alerts").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the log bounded.
  const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  await admin.from("scanner_alerts").delete().lt("detected_at", cutoff);

  return NextResponse.json({ ok: true, inserted: rows.length });
}
