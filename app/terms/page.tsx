import { DISCLAIMERS } from "@/lib/tiers";

// §8.7 draft outline — attorney to finalize. Governing law: Ohio.
export default function TermsPage() {
  return (
    <main className="container max-w-3xl py-16 prose-sm">
      <h1 className="text-2xl font-medium">Terms of Service</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Draft — pending securities-attorney review. Governing law: Ohio.
      </p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong className="text-foreground">1. Description of service.</strong> The Huddle is an educational and informational publisher of analysis about publicly traded securities. We are not a registered investment adviser or a broker-dealer.</p>
        <p><strong className="text-foreground">2. Not investment advice.</strong> {DISCLAIMERS.marketingFooter}</p>
        <p><strong className="text-foreground">3. User obligations.</strong> You must be 18+, have legal capacity to contract, and trade only with your own funds.</p>
        <p><strong className="text-foreground">4. Prohibited uses.</strong> Redistribution or reverse engineering of the service is prohibited.</p>
        <p className="text-xs">Full terms to be finalized with counsel before launch.</p>
      </div>
    </main>
  );
}
