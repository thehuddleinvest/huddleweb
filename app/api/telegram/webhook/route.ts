import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

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
  } | null;

  const chatId = update?.message?.chat?.id;
  const text = (update?.message?.text ?? "").trim();
  if (!chatId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

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
