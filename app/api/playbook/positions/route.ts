import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlpacaPositions } from "@/lib/alpaca";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";

// Live paper positions + unrealized P&L for the signed-in Playbook subscriber.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("alpaca_oauth_token_encrypted")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.alpaca_oauth_token_encrypted) {
    return NextResponse.json({ connected: false, positions: [] });
  }

  const [keyId, secret] = decrypt(profile.alpaca_oauth_token_encrypted).split("\n");
  const raw = await getAlpacaPositions(keyId, secret);
  if (raw === null) {
    return NextResponse.json({ connected: true, positions: [], error: "Couldn't reach Alpaca." });
  }

  const positions = raw.map((p) => ({
    symbol: p.symbol,
    qty: Number(p.qty),
    avgEntry: Number(p.avg_entry_price),
    current: Number(p.current_price),
    marketValue: Number(p.market_value),
    unrealizedPl: Number(p.unrealized_pl),
    unrealizedPlpc: Number(p.unrealized_plpc) * 100,
  }));

  return NextResponse.json({ connected: true, positions });
}
