"use client";

import { useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMERS } from "@/lib/tiers";

export function PlaybookConnect({
  connected,
  telegramConnected,
}: {
  connected: boolean;
  telegramConnected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [amount, setAmount] = useState("500");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(connected);

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Check className="h-4 w-4 text-green-600" /> The Playbook is active
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          When a Drive pick is published, you'll get an approve button in
          Telegram. Every trade waits for your tap — nothing runs on its own.
          {!telegramConnected && " Connect Telegram above to receive approvals."}
        </p>
      </div>
    );
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/playbook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, secret, ack, defaultAmount: amount }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not connect.");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-start gap-3">
        <ClipboardList className="h-5 w-5 shrink-0 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-medium">The Playbook</p>
          <p className="text-sm text-muted-foreground">
            Connect your Alpaca paper account. When a pick is published you'll
            get a one-tap approve button in Telegram — every trade is yours to approve.
          </p>
          {!open && (
            <Button size="sm" variant="accent" className="mt-3" onClick={() => setOpen(true)}>
              Connect Alpaca (paper)
            </Button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={connect} className="mt-4 space-y-3 border-t border-border pt-4">
          <input
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder="Alpaca paper API key ID"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Alpaca paper API secret"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Default amount per approved trade ($)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="flex gap-3 rounded-lg border border-border p-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>{DISCLAIMERS.playbookAck}</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !ack || !keyId || !secret}>
            {busy ? "Connecting…" : "Connect Alpaca paper account"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Paper trading only — no real money. Your keys are encrypted at rest.
          </p>
        </form>
      )}
    </div>
  );
}
