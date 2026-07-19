"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TelegramConnect({ connected }: { connected: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (connected) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
        <Check className="h-4 w-4 text-green-600" />
        Telegram connected — your picks will arrive there too.
      </div>
    );
  }

  async function connect() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not create a link. Try again.");
        return;
      }
      window.open(body.url, "_blank");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center">
      <Send className="h-5 w-5 shrink-0 text-accent" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Get picks on Telegram</p>
        <p className="text-muted-foreground">
          Connect the bot to receive each published pick the moment it goes out.
        </p>
        {error && <p className="mt-1 text-red-600">{error}</p>}
      </div>
      <Button size="sm" variant="accent" onClick={connect} disabled={busy}>
        {busy ? "Opening…" : "Connect Telegram"}
      </Button>
    </div>
  );
}
