import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrategist } from "@/lib/auth";
import { TIERS } from "@/lib/tiers";

export const runtime = "nodejs";

const CATEGORIES = new Set(["daily_alert", "buy_today"]);

async function requireStrategist() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isStrategist(user.email)) return null;
  return user;
}

// Create an approved (unpublished) pick.
export async function POST(req: Request) {
  const user = await requireStrategist();
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    tier?: string;
    ticker?: string;
    category?: string;
    entryPriceReference?: string | number | null;
    strategistNotes?: string;
  };

  const tier = TIERS.find((t) => t.id === body.tier)?.id;
  const ticker = (body.ticker ?? "").trim().toUpperCase();
  const category = CATEGORIES.has(body.category ?? "")
    ? body.category
    : "daily_alert";

  if (!tier) return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  if (!ticker) return NextResponse.json({ error: "Ticker is required." }, { status: 400 });

  const entryRef =
    body.entryPriceReference === "" || body.entryPriceReference == null
      ? null
      : Number(body.entryPriceReference);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("picks")
    .insert({
      tier,
      ticker,
      category,
      entry_price_reference: entryRef,
      strategist_notes: (body.strategistNotes ?? "").trim() || null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("audit_log").insert({
    actor_type: "strategist",
    actor_id: user.id,
    action: "pick_approved",
    entity_type: "pick",
    entity_id: data.id,
    metadata: { tier, ticker, category },
  });

  return NextResponse.json({ pick: data });
}

// Publish an existing pick (makes it visible to entitled subscribers).
export async function PATCH(req: Request) {
  const user = await requireStrategist();
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing pick id." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("picks")
    .update({ published_at: new Date().toISOString() })
    .eq("id", id)
    .is("published_at", null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("audit_log").insert({
    actor_type: "strategist",
    actor_id: user.id,
    action: "pick_published",
    entity_type: "pick",
    entity_id: id,
    metadata: { tier: data?.tier, ticker: data?.ticker },
  });

  // TODO: trigger Telegram/email delivery to entitled subscribers here.
  return NextResponse.json({ pick: data });
}
