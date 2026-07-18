import Link from "next/link";
import { Users, Smartphone, ClipboardList, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { DisclaimerFooter } from "@/components/site/disclaimer-footer";
import { Reveal } from "@/components/site/reveal";
import { PricingCard } from "@/components/marketing/pricing-card";
import { SampleAlert } from "@/components/marketing/sample-alert";
import { Faq } from "@/components/marketing/faq";
import { buttonVariants } from "@/components/ui/button";
import { TIERS, PLAYBOOK } from "@/lib/tiers";

const VALUE_PROPS = [
  {
    icon: Users,
    title: "Group economics",
    body: "Investing is better with a team. Huddle Insiders is a community of goal-driven people learning the market together — no gatekeeping, no jargon.",
  },
  {
    icon: Smartphone,
    title: "Hand-held simplicity",
    body: "No dense charts to decode. Our analysis lands on your phone in plain language, and you act on it in a couple of minutes.",
  },
  {
    icon: ClipboardList,
    title: "Vetted scouting reports",
    body: "A human strategist reviews an algorithmically ranked shortlist every day and explains, in plain terms, why each ticker made the list.",
  },
];

const STEPS = [
  {
    n: "01",
    t: "Pick your tier",
    d: "Choose The Kickoff, The Drive, or The Endzone based on the slice of the market you want to follow.",
  },
  {
    n: "02",
    t: "Get the daily scouting report",
    d: "Our strategist publishes the day's shortlist with the analysis behind it, delivered to your Telegram or inbox.",
  },
  {
    n: "03",
    t: "You make the call",
    d: "Review the analysis and decide for yourself. With The Playbook, one tap approves a trade in your own account — nothing runs automatically.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="hero-surface relative overflow-hidden">
          <div className="grid-overlay pointer-events-none absolute inset-0" aria-hidden />
          <div className="container relative py-24 text-center md:py-32">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-accent backdrop-blur">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Educational market analysis · Huddle Insiders
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
                Read the whole field before you make{" "}
                <span className="text-accent">your play.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                The Huddle brings group economics to the stock market. A human
                strategist scouts the data and sends the day's shortlist to your
                phone. You call every play.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="#pricing" className={buttonVariants({ size: "lg", className: "font-semibold" })}>
                  Get your playbook
                </Link>
                <Link href="#how" className={buttonVariants({ variant: "outline", size: "lg", className: "font-semibold" })}>
                  See how we scout
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                100% educational analysis. You make every final call on your own device.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Value props */}
        <section className="border-y border-border bg-secondary/20">
          <div className="container grid gap-8 py-16 md:grid-cols-3">
            {VALUE_PROPS.map((v, i) => (
              <Reveal key={v.title} delay={i * 90}>
                <div className="flex h-full flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Interactive sample alert */}
        <section className="container py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Reveal>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-accent">See it in action</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">This is what a play looks like.</h2>
                <p className="mt-4 text-muted-foreground">
                  Every alert leads with the signals our strategist saw and the
                  plain-language reasoning behind them. Switch tiers to see how
                  each one reads — then decide for yourself.
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Prefer automation? The Playbook adds a one-tap approve button
                  that executes in your own Alpaca account.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <SampleAlert />
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-secondary/20">
          <div className="container py-20">
            <Reveal>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight">The 3-step game plan</h2>
                <p className="mt-3 text-muted-foreground">
                  Built to be genuinely step-by-step. Here's exactly how it works.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <span className="text-3xl font-bold text-accent/30">{s.n}</span>
                    <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container py-20">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Choose your tier</h2>
              <p className="mt-3 text-muted-foreground">
                Transparent pricing, no contracts. Cancel anytime.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3 md:gap-5">
            {TIERS.map((tier, i) => (
              <Reveal key={tier.id} delay={i * 90}>
                <PricingCard tier={tier} />
              </Reveal>
            ))}
          </div>

          {/* Playbook add-on */}
          <Reveal delay={120}>
            <div className="mt-6 flex flex-col items-start gap-5 rounded-2xl border border-accent/30 bg-accent/5 p-6 md:flex-row md:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <ClipboardList className="h-6 w-6" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">
                  {PLAYBOOK.name} · ${PLAYBOOK.priceOneTime} one-time
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {PLAYBOOK.description}
                </p>
              </div>
              <Link
                href="/sign-up?tier=drive&playbook=1"
                className={buttonVariants({ variant: "accent", className: "w-full font-semibold md:w-auto" })}
              >
                Add The Playbook
              </Link>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-secondary/20">
          <div className="container py-20">
            <Reveal>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight">Questions, answered straight</h2>
                <p className="mt-3 text-muted-foreground">
                  The important ones first — including the ones a good service should never dodge.
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container py-20">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm md:p-16">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                Get the next scouting report in your pocket.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Join Huddle Insiders and start following the daily shortlist. You
                stay in control of every decision.
              </p>
              <Link
                href="#pricing"
                className={buttonVariants({ variant: "accent", size: "lg", className: "mt-8 font-semibold" })}
              >
                Choose your tier
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <DisclaimerFooter />
    </>
  );
}
