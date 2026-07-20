import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrategist } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

// Retract a published pick: hide it (retracted_at + RLS), void any pending
// Playbook approvals, and send a correction to the exact recipients.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isStrategist(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing pick id." }, { status: 400 });

  const admin = createAdminClient();

  const { data: pick } = await admin
    .from("picks")
    .select("id, ticker, tier, published_at, retracted_at")
    .eq("id", id)
    .maybeSingle();
  if (!pick || !pick.published_at || pick.retracted_at) {
    return NextResponse.json(
      { error: "Only a live published pick can be retracted." },
      { status: 400 }
    );
  }

  await admin
    .from("picks")
    .update({ retracted_at: new Date().toISOString() })
    .eq("id", id);

  // Void still-pending Playbook approvals for this pick (already-executed
  // trades stand — the subscriber approved them).
  const { data: pending } = await admin
    .from("trades")
    .select("id")
    .eq("pick_id", id)
    .eq("status", "pending_approval");
  if (pending && pending.length) {
    await admin
      .from("trades")
      .update({ status: "canceled", error_message: "Pick retracted by strategist" })
      .eq("pick_id", id)
      .eq("status", "pending_approval");
  }

  // Correction to everyone who received this pick.
  const { data: recips } = await admin
    .from("notifications")
    .select("user_id")
    .eq("pick_id", id)
    .eq("channel", "telegram");
  const userIds = Array.from(new Set((recips ?? []).map((r) => r.user_id)));
  if (userIds.length) {
    const { data: users } = await admin
      .from("users")
      .select("id, telegram_chat_id")
      .in("id", userIds)
      .not("telegram_chat_id", "is", null);
    const msg =
      `⚠️ <b>Correction:</b> the earlier ${pick.ticker} alert has been retracted — please disregard it. ` +
      `If The Playbook had queued a trade for it, that request has been canceled.\n` +
      `<i>Educational analysis only — not investment advice.</i>`;
    for (const u of users ?? []) {
      await sendTelegramMessage(u.telegram_chat_id as number, msg);
    }
  }

  await admin.from("audit_log").insert({
    actor_type: "strategist",
    actor_id: user.id,
    action: "pick_retracted",
    entity_type: "pick",
    entity_id: id,
    metadata: { ticker: pick.ticker, tier: pick.tier, voided_trades: pending?.length ?? 0 },
  });

  return NextResponse.json({
    ok: true,
    voided: pending?.length ?? 0,
    notified: userIds.length,
  });
}
