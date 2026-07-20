import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// The scanner posts its end-of-day / accuracy report here.
export async function POST(req: Request) {
  const secret = process.env.SCANNER_INGEST_SECRET;
  if (!secret || req.headers.get("x-scanner-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    report_date?: string;
    kind?: string;
    payload?: unknown;
  };

  if (!body.payload) {
    return NextResponse.json({ error: "Missing payload." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("scanner_reports").insert({
    report_date: body.report_date ?? new Date().toISOString().slice(0, 10),
    kind: body.kind === "accuracy" ? "accuracy" : "eod",
    payload: body.payload,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the last ~60 reports.
  const { data: old } = await admin
    .from("scanner_reports")
    .select("id")
    .order("created_at", { ascending: false })
    .range(60, 1000);
  if (old && old.length) {
    await admin
      .from("scanner_reports")
      .delete()
      .in("id", old.map((r: { id: string }) => r.id));
  }

  return NextResponse.json({ ok: true });
}
