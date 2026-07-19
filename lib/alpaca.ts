// Alpaca paper-trading client. Paper only for v0 (no real money).
const PAPER_BASE = "https://paper-api.alpaca.markets";

function headers(keyId: string, secret: string) {
  return {
    "APCA-API-KEY-ID": keyId,
    "APCA-API-SECRET-KEY": secret,
    "Content-Type": "application/json",
  };
}

export interface AlpacaAccount {
  account_number: string;
  status: string;
}

// Validate credentials by reading the account. Returns null if the keys are bad.
export async function getAlpacaAccount(
  keyId: string,
  secret: string
): Promise<AlpacaAccount | null> {
  try {
    const res = await fetch(`${PAPER_BASE}/v2/account`, {
      headers: headers(keyId, secret),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AlpacaAccount;
  } catch {
    return null;
  }
}

export interface OrderResult {
  ok: boolean;
  id?: string;
  status?: string;
  filledAvgPrice?: number | null;
  filledQty?: number | null;
  error?: string;
}

// Place a notional (dollar-amount) market buy on the paper account.
export async function placeNotionalBuy(
  keyId: string,
  secret: string,
  symbol: string,
  notional: number
): Promise<OrderResult> {
  try {
    const res = await fetch(`${PAPER_BASE}/v2/orders`, {
      method: "POST",
      headers: headers(keyId, secret),
      body: JSON.stringify({
        symbol,
        notional: String(notional),
        side: "buy",
        type: "market",
        time_in_force: "day",
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: (body.message as string) ?? `Alpaca error ${res.status}` };
    }
    return {
      ok: true,
      id: body.id as string,
      status: body.status as string,
      filledAvgPrice: body.filled_avg_price ? Number(body.filled_avg_price) : null,
      filledQty: body.filled_qty ? Number(body.filled_qty) : null,
    };
  } catch {
    return { ok: false, error: "Could not reach Alpaca." };
  }
}
