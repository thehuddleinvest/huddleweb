"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { DISCLAIMERS, TIERS, type TierId } from "@/lib/tiers";

export function SignUpForm({ defaultTier }: { defaultTier?: string }) {
  const validTier = TIERS.find((t) => t.id === defaultTier)?.id;
  const [tier, setTier] = useState<TierId | undefined>(validTier as TierId | undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ackOne, setAckOne] = useState(false);
  const [ackTwo, setAckTwo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = tier && email && password.length >= 8 && ackOne && ackTwo && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      let hasSession = !!data?.session;

      if (signUpError) {
        // Account already exists — sign in with the entered password and
        // resume checkout (e.g. a prior attempt that didn't finish paying).
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(
            "That email already has an account. Enter the correct password, or use Sign in below."
          );
          return;
        }
        hasSession = !!signInData.session;
      } else if (!data.session) {
        // Email confirmation is on — no session yet.
        setNotice(
          "Check your email to confirm your account, then sign in and choose your tier."
        );
        return;
      }

      if (!hasSession) {
        setError("Could not establish a session. Please sign in and try again.");
        return;
      }

      // Session is live — record the risk ack + start Stripe Checkout.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Choose your tier</label>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                tier === t.id
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <span className="block font-medium">{t.name}</span>
              <span className="text-muted-foreground">${t.priceMonthly}/mo</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="email"
          required
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          type="password"
          required
          placeholder="Password (at least 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-3">
        <label className="flex gap-3 rounded-lg border border-border p-4 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={ackOne}
            onChange={(e) => setAckOne(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{DISCLAIMERS.riskAckOne}</span>
        </label>
        <label className="flex gap-3 rounded-lg border border-border p-4 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={ackTwo}
            onChange={(e) => setAckTwo(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{DISCLAIMERS.riskAckTwo}</span>
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-red-600">{error}</p>
      )}
      {notice && (
        <p className="rounded-md bg-accent/10 p-3 text-sm text-accent">{notice}</p>
      )}

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {loading ? "Starting checkout…" : "Continue to payment"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </p>
    </form>
  );
}
