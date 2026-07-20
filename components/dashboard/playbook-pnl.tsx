"use client";

import { useEffect, useState } from "react";

interface Position {
  symbol: string;
  qty: number;
  avgEntry: number;
  current: number;
  marketValue: number;
  unrealizedPl: number;
  unrealizedPlpc: number;
}

export function PlaybookPnl() {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/playbook/positions")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setPositions(Array.isArray(d.positions) ? d.positions : []);
        if (d.error) setNote(d.error);
      })
      .catch(() => active && setNote("Could not load positions."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const totalPl = positions.reduce((s, p) => s + p.unrealizedPl, 0);
  const plColor = (v: number) => (v >= 0 ? "text-green-600" : "text-red-600");
  const sign = (v: number) => (v >= 0 ? "+" : "");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Playbook P&amp;L (paper)</h3>
        {!loading && positions.length > 0 && (
          <span className={`text-sm font-semibold ${plColor(totalPl)}`}>
            {sign(totalPl)}${Math.abs(totalPl).toFixed(2)}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading positions…</p>
      ) : positions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {note ?? "No open positions yet. Approved trades will appear here."}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border text-sm">
          {positions.map((p) => (
            <li key={p.symbol} className="flex items-center gap-3 py-2">
              <span className="w-16 font-semibold">{p.symbol}</span>
              <span className="w-16 text-muted-foreground">{p.qty} sh</span>
              <span className="w-24 text-muted-foreground">@ ${p.avgEntry.toFixed(2)}</span>
              <span className="flex-1 text-muted-foreground">now ${p.current.toFixed(2)}</span>
              <span className={plColor(p.unrealizedPl)}>
                {sign(p.unrealizedPl)}${Math.abs(p.unrealizedPl).toFixed(2)} ({p.unrealizedPlpc.toFixed(1)}%)
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Live from your Alpaca paper account. Paper money — not real. Not investment advice.
      </p>
    </div>
  );
}
