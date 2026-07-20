"use client";

import { useMemo, useRef, useState } from "react";
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
  retracted_at: string | null;
  created_at: string;
}

export interface Ranking {
  cluster: string;
  ticker: string;
  rank: number;
  score: number | null;
  signals: Record<string, unknown> | null;
  tier: string;
}

function signalSummary(signals: Record<string, unknown> | null): string {
  if (!signals) return "";
  return Object.entries(signals)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export function StrategistConsole({
  initialPicks,
  rankings,
}: {
  initialPicks: Pick[];
  rankings: Ranking[];
}) {
  const [picks, setPicks] = useState<Pick[]>(initialPicks);
  const [tab, setTab] = useState<"shortlist" | "picks">(
    rankings.length ? "shortlist" : "picks"
  );

  // Pick form
  const [tier, setTier] = useState("kickoff");
  const [ticker, setTicker] = useState("");
  const [category, setCategory] = useState("daily_alert");
  const [entry, setEntry] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const clusters = useMemo(() => {
    const map = new Map<string, Ranking[]>();
    for (const r of rankings) {
      const arr = map.get(r.cluster) ?? [];
      arr.push(r);
      map.set(r.cluster, arr);
    }
    Array.from(map.values()).forEach((arr) => arr.sort((a, b) => a.rank - b.rank));
    return Array.from(map.entries());
  }, [rankings]);

  function useCandidate(r: Ranking) {
    setTier(r.tier);
    setTicker(r.ticker);
    setCategory("daily_alert");
    setEntry("");
    setNotes(
      `Scanner shortlist — ${r.cluster}, rank #${r.rank}` +
        (r.score != null ? `, score ${r.score}` : "") +
        `. Review before publishing. This is educational analysis, not a recommendation.`
    );
    setTab("picks");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const tierName = (id: string) => TIERS.find((t) => t.id === id)?.name ?? id;

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
      if (!res.ok) return setError(body.error ?? "Could not save the pick.");
      setPicks((prev) => [body.pick, ...prev]);
      setTicker("");
      setEntry("");
      setNotes("");
    } finally {
      setBusy(false);
    }
  }

  async function publish(id: string) {
    setPendingId(id);
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
      setPendingId(null);
    }
  }

  async function deleteDraft(id: string) {
    setPendingId(id);
    try {
      const res = await fetch("/api/strategist/picks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setPicks((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setPendingId(null);
    }
  }

  async function retract(id: string) {
    if (
      !window.confirm(
        "Retract this published pick? Subscribers who received it will get a correction, and any pending Playbook approvals will be canceled. Already-executed trades can't be undone."
      )
    )
      return;
    setPendingId(id);
    try {
      const res = await fetch("/api/strategist/retract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (res.ok) {
        setPicks((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, retracted_at: new Date().toISOString() } : p
          )
        );
        alert(`Retracted. Correction sent to ${body.notified}, ${body.voided} pending trade(s) canceled.`);
      } else {
        alert(body.error ?? "Could not retract.");
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Pick form */}
      <form ref={formRef} onSubmit={createPick} className="h-fit space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-medium">New pick</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Tier</span>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2">
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2">
              <option value="daily_alert">Daily alert</option>
              <option value="buy_today">Buy today</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Ticker</span>
            <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" className="h-10 w-full rounded-md border border-input bg-background px-3 uppercase" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Entry price ref</span>
            <input value={entry} onChange={(e) => setEntry(e.target.value)} inputMode="decimal" placeholder="optional" className="h-10 w-full rounded-md border border-input bg-background px-3" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Analysis / notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Why this ticker made the shortlist. Framed as analysis, not a recommendation." className="w-full rounded-md border border-input bg-background p-3 text-sm" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !ticker.trim()}>
          {busy ? "Saving…" : "Save pick"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Saved picks stay as drafts until you publish. Publishing sends them to subscribers of that tier.
        </p>
      </form>

      {/* Right panel: Shortlist / Picks */}
      <div>
        <div className="mb-4 inline-flex rounded-full border border-border bg-secondary/50 p-1 text-sm">
          <button onClick={() => setTab("shortlist")} className={`rounded-full px-4 py-1.5 font-medium transition-colors ${tab === "shortlist" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Shortlist{rankings.length ? ` (${clusters.length})` : ""}
          </button>
          <button onClick={() => setTab("picks")} className={`rounded-full px-4 py-1.5 font-medium transition-colors ${tab === "picks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Picks
          </button>
        </div>

        {tab === "shortlist" ? (
          clusters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No scanner shortlist yet. It appears here once the scanner posts its rankings.
            </div>
          ) : (
            <div className="space-y-4">
              {clusters.map(([cluster, items]) => (
                <div key={cluster} className="rounded-xl border border-border">
                  <div className="border-b border-border px-4 py-2 text-sm font-medium">
                    {cluster} <span className="text-muted-foreground">· top {items.length}</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {items.slice(0, 10).map((r) => (
                      <li key={`${r.cluster}-${r.ticker}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="w-6 text-muted-foreground">{r.rank}</span>
                        <span className="w-16 font-semibold">{r.ticker}</span>
                        <span className="w-14 text-muted-foreground">{r.score != null ? Number(r.score).toFixed(0) : "—"}</span>
                        <span className="flex-1 truncate text-xs text-muted-foreground">{signalSummary(r.signals)}</span>
                        <Button size="sm" variant="outline" onClick={() => useCandidate(r)}>Use</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )
        ) : picks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No picks yet. Use a shortlist candidate or the form on the left.
          </div>
        ) : (
          <ul className="space-y-3">
            {picks.map((p) => (
              <li key={p.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{p.ticker}</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{tierName(p.tier)}</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{p.category === "buy_today" ? "Buy today" : "Daily alert"}</span>
                    </div>
                    {p.entry_price_reference != null && (
                      <p className="mt-1 text-sm text-muted-foreground">Entry ref: {p.entry_price_reference}</p>
                    )}
                    {p.strategist_notes && <p className="mt-2 text-sm">{p.strategist_notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {p.retracted_at ? (
                      <span className="text-xs font-medium text-red-600">Retracted</span>
                    ) : p.published_at ? (
                      <>
                        <span className="text-xs font-medium text-green-600">Published</span>
                        <button onClick={() => retract(p.id)} disabled={pendingId === p.id} className="text-xs text-red-600 hover:underline">
                          {pendingId === p.id ? "…" : "Retract"}
                        </button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="accent" onClick={() => publish(p.id)} disabled={pendingId === p.id}>
                          {pendingId === p.id ? "…" : "Publish"}
                        </Button>
                        <button onClick={() => deleteDraft(p.id)} disabled={pendingId === p.id} className="text-xs text-muted-foreground hover:text-red-600">
                          Delete
                        </button>
                      </>
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
