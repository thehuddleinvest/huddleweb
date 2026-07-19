import { TIERS } from "@/lib/tiers";

const API = "https://api.telegram.org";

// Send a plain HTML message via the Telegram Bot API. Returns true on 200.
export async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
