"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TelegramConnect({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // While waiting on the user to tap "Start" in Telegram, poll the server so the
  // box flips to "connected" on its own — no page reload, no re-clicking.
  useEffect(() => {
    if (!waiting) return;
    let active = true;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch("/api/telegram/status", { cache: "no-store" });
        const body = await res.json();
        if (active && body.connected) {
          clearInterval(timer);
          router.refresh(); // re-runs the server render → shows the green box
          return;
        }
      } catch {
        /* ignore a blip; keep polling */
      }
      if (active && tries >= 40) {
        // ~2 minutes with no link — stop and offer the manual path.
        clearInterval(timer);
        setWaiting(false);
        setNote(
          "Didn't catch it automatically. If Telegram showed “✅ Connected!”, tap “Check now.” If nothing happened there, tap “Connect Telegram” for a fresh link (they expire after a few minutes)."
        );
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [waiting, router]);

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
    setNote(null);
    setBusy(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not create a link. Try again.");
        return;
      }
      window.open(body.url, "_blank");
      setWaiting(true); // begin auto-detect
    } finally {
      setBusy(false);
    }
  }

  async function checkNow() {
    setChecking(true);
    setNote(null);
    setError(null);
    try {
      const res = await fetch("/api/telegram/status", { cache: "no-store" });
      const body = await res.json();
      if (body.connected) {
        router.refresh();
      } else {
        setNote(
          "Not linked yet. Open the chat with the Huddle bot in Telegram and tap “Start” — you should see “✅ Connected!”. Then tap “Check now.”"
        );
      }
    } catch {
      setNote("Couldn't check just now — try again in a moment.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Send className="h-5 w-5 shrink-0 text-accent" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Get picks on Telegram</p>
          <p className="text-muted-foreground">
            Connect the bot to receive each published pick the moment it goes out.
          </p>
        </div>
        <Button size="sm" variant="accent" onClick={connect} disabled={busy}>
          {busy ? "Opening…" : waiting ? "Reopen link" : "Connect Telegram"}
        </Button>
      </div>

      {waiting && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for Telegram… tap “Start” in the chat that opened. This updates on its own.
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Saw “✅ Connected!” in Telegram?</span>
        <Button size="sm" variant="outline" onClick={checkNow} disabled={checking}>
          {checking ? "Checking…" : "Check now"}
        </Button>
      </div>

      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
