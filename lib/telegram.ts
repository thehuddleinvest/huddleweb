import { TIERS } from "@/lib/tiers";

const API = "https://api.telegram.org";

type InlineKeyboard = { inline_keyboard: { text: string; callback_data: string }[][] };

async function tgApi(method: string, payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Send an HTML message, optionally with inline buttons. Returns true on 200.
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<boolean> {
  return tgApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

// Acknowledge a button tap so Telegram stops the loading spinner.
export async function answerCallbackQuery(id: string, text?: string): Promise<boolean> {
  return tgApi("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
}

// Remove the inline buttons from a message (after it's been acted on).
export async function clearButtons(
  chatId: number | string,
  messageId: number
): Promise<boolean> {
  return tgApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}

export function approveKeyboard(tradeId: string, amount: number): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: `✅ Approve $${amount}`, callback_data: `a:${tradeId}` },
        { text: "✕ Skip", callback_data: `s:${tradeId}` },
      ],
    ],
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Compliance-framed pick message (§8 — analysis, never a recommendation).
export function formatPickMessage(pick: {
  tier: string;
  ticker: string;
  category: string;
  entry_price_reference: number | null;
  strategist_notes: string | null;
}): string {
  const tierName = TIERS.find((t) => t.id === pick.tier)?.name ?? pick.tier;
  const cat = pick.category === "buy_today" ? "Buy today" : "Daily alert";
  const lines = [
    `<b>Huddle alert · ${escapeHtml(tierName)}</b>`,
    `<b>${escapeHtml(pick.ticker)}</b> — ${cat}`,
  ];
  if (pick.entry_price_reference != null) {
    lines.push(`Entry price reference: ${pick.entry_price_reference}`);
  }
  if (pick.strategist_notes) {
    lines.push("", escapeHtml(pick.strategist_notes));
  }
  lines.push(
    "",
    "<i>Educational analysis, not a recommendation. Trading involves risk of loss. You make every decision.</i>"
  );
  return lines.join("\n");
}
