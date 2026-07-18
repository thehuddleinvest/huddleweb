import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Tier } from "@/lib/tiers";

export function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
        tier.featured
          ? "border-accent shadow-lg ring-1 ring-accent/30"
          : "border-border shadow-sm"
      )}
    >
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow">
          Most popular
        </span>
      )}

      <h3 className="text-sm font-medium text-muted-foreground">{tier.name}</h3>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">${tier.priceMonthly}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {tier.description}
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
        {tier.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/sign-up?tier=${tier.id}`}
        className={cn(
          buttonVariants({ variant: tier.featured ? "accent" : "outline", size: "lg" }),
          "mt-6 w-full font-semibold"
        )}
      >
        Choose {tier.name}
      </Link>
    </div>
  );
}
