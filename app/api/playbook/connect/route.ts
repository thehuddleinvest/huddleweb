import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlpacaAccount } from "@/lib/alpaca";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";

// Connect a subscriber's Alpaca PAPER account for The Playbook (v0).
// Gated to active Drive subscribers. Requires the §8.2 activation ack.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    keyId?: string;
    secret?: string;
    ack?: boolean;
    defaultAmount?: string | number;
  };

  if (!body.ack) {
    return NextResponse.json(
      { error: "You must accept the Playbook activation acknowledgment." },
      { status: 400 }
    );
  }

  const keyId = (body.keyId ?? "").trim();
  const secret = (body.secret ?? "").trim();
  if (!keyId || !secret) {
    return NextResponse.json(
      { error: "Both your Alpaca paper key and secret are required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Entitlement: must hold an active/trialing Drive subscription (v0 scope).
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("tier", "drive")
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (!sub) {
    return NextResponse.json(
      { error: "The Playbook is available on The Drive during launch." },
      { status: 403 }
    );
  }

  // Validate the keys against Alpaca's paper API.
  const account = await getAlpacaAccount(keyId, secret);
  if (!account) {
    return NextResponse.json(
      { error: "Couldn't connect to Alpaca with those paper keys. Double-check them." },
      { status: 400 }
    );
  }

  const amount = Number(body.defaultAmount);
  const update: Record<string, unknown> = {
    alpaca_oauth_token_encrypted: encrypt(`${keyId}\n${secret}`),
    alpaca_account_id: account.account_number,
    risk_ack_playbook_at: new Date().toISOString(),
  };
  if (Number.isFinite(amount) && amount > 0) {
    update.default_trade_amounts = { kickoff: 100, drive: amount, endzone: 1000 };
  }

  await admin.from("users").update(update).eq("id", user.id);

  await admin.from("audit_log").insert({
    actor_type: "user",
    actor_id: user.id,
    action: "playbook_connected",
    entity_type: "user",
    entity_id: user.id,
    metadata: { alpaca_account: account.account_number },
  });

  return NextResponse.json({ ok: true, account: account.account_number });
}
