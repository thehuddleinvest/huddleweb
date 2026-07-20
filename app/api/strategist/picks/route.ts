import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrategist } from "@/lib/auth";
import { TIERS } from "@/lib/tiers";
import { sendTelegramMessage, formatPickMessage, approveKeyboard } from "@/lib/telegram";

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

  // Deliver to entitled subscribers who have linked Telegram.
  if (data) {
    try {
      const { data: subs } = await admin
        .from("subscriptions")
        .select("user_id")
        .eq("tier", data.tier)
        .in("status", ["active", "trialing"]);
      const userIds = Array.from(
        new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))
      );
      if (userIds.length) {
        const { data: recips } = await admin
          .from("users")
          .select(
            "id, telegram_chat_id, notification_preference, alpaca_oauth_token_encrypted, default_trade_amounts"
          )
          .in("id", userIds)
          .not("telegram_chat_id", "is", null);
        const text = formatPickMessage(data);
        for (const u of recips ?? []) {
          if (u.notification_preference === "email") continue;
          const chatId = u.telegram_chat_id as number;

          // Playbook: a Drive pick to a subscriber with Alpaca connected gets
          // an approve/skip prompt (each trade individually approved, §2.2).
          const playbookEligible =
            data.tier === "drive" && !!u.alpaca_oauth_token_encrypted;

          if (playbookEligible) {
            const amount = Number(u.default_trade_amounts?.drive) || 500;
            const { data: trade } = await admin
              .from("trades")
              .insert({
                user_id: u.id,
                pick_id: data.id,
                ticker: data.ticker,
                side: "buy",
                dollar_amount: amount,
                status: "pending_approval",
              })
              .select("id")
              .single();
            const prompt =
              text +
              `\n\n<b>Playbook:</b> approve to buy $${amount} of ${data.ticker} in your Alpaca paper account.\n<i>You are executing this trade. Losses are possible. This is not investment advice.</i>`;
            const ok = await sendTelegramMessage(
              chatId,
              prompt,
              trade ? approveKeyboard(trade.id, amount) : undefined
            );
            await admin.from("notifications").insert({
              user_id: u.id,
              channel: "telegram",
              message_type: "trade_approval_request",
              content_snapshot: prompt,
              delivered: ok,
              pick_id: data.id,
            });
          } else {
            const ok = await sendTelegramMessage(chatId, text);
            await admin.from("notifications").insert({
              user_id: u.id,
              channel: "telegram",
              message_type: "pick_delivery",
              content_snapshot: text,
              delivered: ok,
              pick_id: data.id,
            });
          }
        }
      }
    } catch {
      // Delivery failures must not fail the publish.
    }
  }

  return NextResponse.json({ pick: data });
}

// Soft-delete a draft pick (only if it was never published).
export async function DELETE(req: Request) {
  const user = await requireStrategist();
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing pick id." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("picks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("published_at", null)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Only unpublished drafts can be deleted." },
      { status: 400 }
    );
  }

  await admin.from("audit_log").insert({
    actor_type: "strategist",
    actor_id: user.id,
    action: "pick_deleted",
    entity_type: "pick",
    entity_id: id,
  });

  return NextResponse.json({ ok: true });
}
