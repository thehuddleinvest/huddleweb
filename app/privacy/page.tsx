// §8.8 draft outline — attorney to finalize.
export default function PrivacyPage() {
  return (
    <main className="container max-w-3xl py-16">
      <h1 className="text-2xl font-medium">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Draft — pending attorney review.
      </p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>We collect only what payment and account creation require. We do not ask for or store your financial situation, net worth, or risk tolerance (§2.2).</p>
        <p>No credit card data touches our servers — Stripe handles all payment information.</p>
        <p>We use your email and (optionally) Telegram ID solely to deliver picks, transactional messages, and support.</p>
        <p className="text-xs">Full policy to be finalized with counsel before launch.</p>
      </div>
    </main>
  );
}
