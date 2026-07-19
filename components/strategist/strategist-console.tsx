"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/lib/tiers";

export interface Pick {
  id: string;
  tier: string;
  ticker: string;
  category: string;
  entry_price_reference: number | null;
  strategist_notes: string | null;
  published_at: string | null;
  created_at: string;
}

export function StrategistConsole({ initialPicks }: { initialPicks: Pick[] }) {
  const [picks, setPicks] = useState<Pick[]>(initialPicks);
  const [tier, setTier] = useState<string>("drive");
  const [ticker, setTicker] = useState("");
  const [category, setCategory] = useState("daily_alert");
  const [entry, setEntry] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  async function createPick(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/strategist/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          ticker,
          category,
          entryPriceReference: entry,
          strategistNotes: notes,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not save the pick.");
        return;
      }
      setPicks((prev) => [body.pick, ...prev]);
      setTicker("");
      setEntry("");
      setNotes("");
    } finally {
      setBusy(false);
    }
  }

  async function publish(id: string) {
    setPublishingId(id);
    try {
      const res = await fetch("/api/strategist/picks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (res.ok && body.pick) {
        setPicks((prev) => prev.map((p) => (p.id === id ? body.pick : p)));
      }
    } finally {
      setPublishingId(null);
    }
  }

  const tierName = (id: string) => TIERS.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Create a pick */}
      <form onSubmit={createPick} className="h-fit space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-medium">New pick</h2>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Tier</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-2"
            >
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-2"
            >
              <option value="daily_alert">Daily alert</option>
              <option value="buy_today">Buy today</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Ticker</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="AAPL"
              className="h-10 w-full rounded-md border border-input bg-background px-3 uppercase"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Entry price ref</span>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              inputMode="decimal"
              placeholder="optional"
              className="h-10 w-full rounded-md border border-input bg-background px-3"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Analysis / notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Why this ticker made the shortlist. Framed as analysis, not a recommendation."
            className="w-full rounded-md border border-input bg-background p-3 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={busy || !ticker.trim()}>
          {busy ? "Saving…" : "Save pick"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Saved picks stay as drafts until you publish. Publishing makes them
          visible to subscribers of that tier.
        </p>
      </form>

      {/* Picks list */}
      <div>
        <h2 className="mb-3 font-medium">Picks</h2>
        {picks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No picks yet. Create one on the left.
          </div>
        ) : (
          <ul className="space-y-3">
            {picks.map((p) => (
              <li key={p.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{p.ticker}</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {tierName(p.tier)}
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {p.category === "buy_today" ? "Buy today" : "Daily alert"}
                      </span>
                    </div>
                    {p.entry_price_reference != null && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Entry ref: {p.entry_price_reference}
                      </p>
                    )}
                    {p.strategist_notes && (
                      <p className="mt-2 text-sm">{p.strategist_notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {p.published_at ? (
                      <span className="text-xs font-medium text-green-600">Published</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => publish(p.id)}
                        disabled={publishingId === p.id}
                      >
                        {publishingId === p.id ? "Publishing…" : "Publish"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
