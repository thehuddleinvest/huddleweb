import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  clearButtons,
} from "@/lib/telegram";
import { placeNotionalBuy } from "@/lib/alpaca";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";

// Telegram calls this endpoint for every bot update. Verify the secret token
// header we set on setWebhook so only Telegram can reach it.
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const got = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret && got !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as {
    message?: { text?: string; chat?: { id?: number } };
    callback_query?: {
      id: string;
      data?: string;
      message?: { message_id?: number; chat?: { id?: number } };
    };
  } | null;

  const admin = createAdminClient();

  // ----- Button taps: Playbook approve / skip -----
  if (update?.callback_query) {
    await handleCallback(admin, update.callback_query);
    return NextResponse.json({ ok: true });
  }

  const chatId = update?.message?.chat?.id;
  const text = (update?.message?.text ?? "").trim();
  if (!chatId) return NextResponse.json({ ok: true });

  if (text.startsWith("/start")) {
    const parts = text.split(/\s+/);
    const token = parts[1];

    if (token) {
      // Link this chat to the account that owns a valid, unused token.
      const { data: row } = await admin
        .from("telegram_link_tokens")
        .select("user_id, used_at, expires_at")
        .eq("token", token)
        .maybeSingle();

      const valid =
        row && !row.used_at && new Date(row.expires_at).getTime() > Date.now();

      if (valid) {
        // A Telegram chat belongs to exactly one account — detach it from any
        // other user first so lookups by chat_id are always unambiguous.
        await admin
          .from("users")
          .update({ telegram_chat_id: null })
          .eq("telegram_chat_id", chatId)
          .neq("id", row.user_id);
        await admin
          .from("users")
          .update({ telegram_chat_id: chatId, notification_preference: "both" })
          .eq("id", row.user_id);
        await admin
          .from("telegram_link_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("token", token);
        await admin.from("audit_log").insert({
          actor_type: "user",
          actor_id: row.user_id,
          action: "telegram_linked",
          entity_type: "user",
          entity_id: row.user_id,
          metadata: { chat_id: chatId },
        });
        await sendTelegramMessage(
          chatId,
          "✅ Connected! You'll get your Huddle picks here. Educational analysis only — not investment advice."
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "That link is invalid or expired. Open your Huddle dashboard and tap “Connect Telegram” for a fresh link."
        );
      }
    } else {
      await sendTelegramMessage(
        chatId,
        "Welcome to The Huddle. To receive your picks here, open your dashboard and tap “Connect Telegram.”"
      );
    }
  } else if (text.startsWith("/help")) {
    await sendTelegramMessage(
      chatId,
      "The Huddle delivers your daily scouting reports here. Manage your subscription from your dashboard. Educational analysis only — not investment advice."
    );
  } else if (text.startsWith("/status")) {
    const { data: u } = await admin
      .from("users")
      .select("id")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();
    await sendTelegramMessage(
      chatId,
      u ? "Your Telegram is connected to The Huddle." : "This chat isn't linked yet. Tap “Connect Telegram” on your dashboard."
    );
  }

  return NextResponse.json({ ok: true });
}

// Handle a Playbook approve/skip button tap. Each approval is per-trade (§2.2);
// paper execution only. Idempotent: only acts on a still-pending trade.
async function handleCallback(
  admin: ReturnType<typeof createAdminClient>,
  cq: { id: string; data?: string; message?: { message_id?: number; chat?: { id?: number } } }
) {
  await answerCallbackQuery(cq.id);
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;
  const [action, tradeId] = (cq.data ?? "").split(":");
  if (!chatId || !tradeId) return;

  const { data: u } = await admin
    .from("users")
    .select("id, alpaca_oauth_token_encrypted")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (!u) return;

  const { data: trade } = await admin
    .from("trades")
    .select("id, ticker, dollar_amount, status")
    .eq("id", tradeId)
    .eq("user_id", u.id)
    .maybeSingle();

  if (!trade || trade.status !== "pending_approval") {
    await sendTelegramMessage(chatId, "That trade is no longer pending.");
    return;
  }

  if (messageId) await clearButtons(chatId, messageId);

  if (action === "s") {
    await admin.from("trades").update({ status: "canceled" }).eq("id", tradeId);
    await sendTelegramMessage(chatId, `Skipped ${trade.ticker}. No trade placed.`);
    return;
  }

  // Approve → execute on Alpaca paper.
  await admin
    .from("trades")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", tradeId);

  if (!u.alpaca_oauth_token_encrypted) {
    await admin
      .from("trades")
      .update({ status: "failed", error_message: "Alpaca not connected" })
      .eq("id", tradeId);
    await sendTelegramMessage(
      chatId,
      "Your Alpaca account isn't connected. Reconnect it from your dashboard."
    );
    return;
  }

  const [keyId, secret] = decrypt(u.alpaca_oauth_token_encrypted).split("\n");
  const result = await placeNotionalBuy(
    keyId,
    secret,
    trade.ticker,
    Number(trade.dollar_amount)
  );

  if (result.ok) {
    await admin
      .from("trades")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
        alpaca_order_id: result.id ?? null,
        fill_price: result.filledAvgPrice ?? null,
        shares_filled: result.filledQty ?? null,
      })
      .eq("id", tradeId);
    await admin.from("audit_log").insert({
      actor_type: "user",
      actor_id: u.id,
      action: "trade_executed",
      entity_type: "trade",
      entity_id: tradeId,
      metadata: { ticker: trade.ticker, amount: trade.dollar_amount, order_id: result.id },
    });
    await sendTelegramMessage(
      chatId,
      `✅ Submitted: buy $${trade.dollar_amount} of ${trade.ticker} (paper). Order status: ${result.status ?? "accepted"}.\n<i>Paper trade — not real money. Not investment advice.</i>`
    );
  } else {
    await admin
      .from("trades")
      .update({ status: "failed", error_message: result.error ?? "Order failed" })
      .eq("id", tradeId);
    await sendTelegramMessage(
      chatId,
      `Trade failed: ${result.error ?? "Alpaca rejected the order."}`
    );
  }
}
