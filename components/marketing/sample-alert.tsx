"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TIERS } from "@/lib/tiers";
import { Check, TrendingUp, Newspaper, Activity } from "lucide-react";

// Interactive, illustrative preview of what a published pick looks like.
// Everything here is a fictional example — never a real ticker or recommendation.
const SAMPLES: Record<
  string,
  { ticker: string; company: string; signals: { icon: React.ReactNode; label: string }[]; note: string; playbook: boolean }
> = {
  kickoff: {
    ticker: "$XMPL",
    company: "Example Micro Co.",
    signals: [
      { icon: <Activity className="h-4 w-4" />, label: "Volume spike vs. 30-day average" },
      { icon: <TrendingUp className="h-4 w-4" />, label: "Holding above near-term support" },
    ],
    note: "Our strategist flagged this ticker for the pattern shown above. This is educational analysis — not a recommendation to buy or sell.",
    playbook: false,
  },
  drive: {
    ticker: "$SMPL",
    company: "Sample Industries Inc.",
    signals: [
      { icon: <TrendingUp className="h-4 w-4" />, label: "Multi-day relative strength" },
      { icon: <Newspaper className="h-4 w-4" />, label: "Positive news-flow signal" },
      { icon: <Activity className="h-4 w-4" />, label: "Steady liquidity" },
    ],
    note: "Delivered to your Telegram. With The Playbook, an approve button lets you execute in your own Alpaca account — one tap, your decision.",
    playbook: true,
  },
  endzone: {
    ticker: "$DEMO",
    company: "Demonstration Corp.",
    signals: [
      { icon: <TrendingUp className="h-4 w-4" />, label: "Trend continuation setup" },
      { icon: <Activity className="h-4 w-4" />, label: "Above-average institutional volume" },
    ],
    note: "Our most selective daily shortlist. Shown for illustration only — you make every final call yourself.",
    playbook: false,
  },
};

export function SampleAlert() {
  const [active, setActive] = useState<string>("drive");
  const sample = SAMPLES[active];

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-border bg-secondary/50 p-1 text-sm">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => setActive(tier.id)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              active === tier.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tier.name}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-accent" />
            Huddle alert · today
          </div>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            Illustrative example
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">{sample.ticker}</span>
          <span className="text-sm text-muted-foreground">{sample.company}</span>
        </div>

        <ul className="mt-4 space-y-2">
          {sample.signals.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-accent">{s.icon}</span>
              {s.label}
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
          {sample.note}
        </p>

        {sample.playbook ? (
          <>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              <Check className="h-4 w-4" /> Approve &amp; execute in my account
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              You are executing this trade. Losses are possible. This is not investment advice.
            </p>
          </>
        ) : (
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Educational analysis only. You make every final call on your own device.
          </p>
        )}
      </div>
    </div>
  );
}
