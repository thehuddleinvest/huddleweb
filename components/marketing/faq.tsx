"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is this investment advice?",
    a: "No. The Huddle is an educational and informational service. We publish analysis about publicly traded securities — nothing here is a recommendation to buy or sell, and you make every trading decision yourself.",
  },
  {
    q: "Do you ever hold or trade my money?",
    a: "Never. We don't hold funds or securities. With The Playbook you connect your own Alpaca account, and every trade waits for your one-tap approval — nothing executes on its own.",
  },
  {
    q: "What's the difference between the tiers?",
    a: "Each tier covers a different slice of the market: The Kickoff follows penny stocks, The Drive follows mid-tier names, and The Endzone follows top-tier tickers. You get the same daily strategist-reviewed shortlist format for whichever tier you choose.",
  },
  {
    q: "What is The Playbook?",
    a: "A one-time $800 add-on that connects your brokerage through Alpaca. When a pick is published you get a message with an approve button, and the trade only fires when you tap it. During launch it's available on The Drive tier.",
  },
  {
    q: "Can you guarantee returns?",
    a: "No — and anyone who does should be a red flag. Trading securities involves substantial risk of loss, including your entire investment, and past performance does not guarantee future results.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-border rounded-2xl border border-border bg-card">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid overflow-hidden px-5 transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              )}
            >
              <p className="min-h-0 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
