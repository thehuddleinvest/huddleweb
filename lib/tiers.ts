// Single source of truth for tier naming + pricing.
// Enum values (kickoff/drive/endzone/playbook) match the Postgres schema
// in founding_architecture.txt §5.1. Prices are LOCKED (§1.1).

export type TierId = "kickoff" | "drive" | "endzone";

export interface Tier {
  id: TierId;
  name: string;
  priceMonthly: number;
  blurb: string;
  description: string;
  // Factual, MVP-true highlights only. No performance or guarantee language.
  highlights: string[];
  featured?: boolean;
  // Stripe Price ID is read from env at checkout time, never hardcoded.
  stripePriceEnv: string;
}

const COMMON_HIGHLIGHTS = [
  "Daily strategist-reviewed shortlist",
  "Telegram + email delivery",
  "Full past-picks history",
  "Huddle Insiders membership",
];

export const TIERS: Tier[] = [
  {
    id: "kickoff",
    name: "The Kickoff",
    priceMonthly: 49,
    blurb: "Penny-stock watchlist",
    description:
      "For following our highest-volatility category. A daily shortlist of penny-stock tickers with the strategist's analysis.",
    highlights: ["Penny-stock coverage", ...COMMON_HIGHLIGHTS],
    stripePriceEnv: "STRIPE_PRICE_KICKOFF",
  },
  {
    id: "drive",
    name: "The Drive",
    priceMonthly: 199,
    blurb: "Mid-tier names",
    description:
      "More liquid, steadier setups — and the tier available for The Playbook during launch.",
    highlights: [
      "Mid-tier coverage",
      ...COMMON_HIGHLIGHTS,
      "Playbook-eligible tier",
    ],
    featured: true,
    stripePriceEnv: "STRIPE_PRICE_DRIVE",
  },
  {
    id: "endzone",
    name: "The Endzone",
    priceMonthly: 299,
    blurb: "Top-tier watchlist",
    description:
      "Our most selective daily shortlist, focused on established tickers.",
    highlights: ["Top-tier coverage", ...COMMON_HIGHLIGHTS],
    stripePriceEnv: "STRIPE_PRICE_ENDZONE",
  },
];

export const PLAYBOOK = {
  name: "The Playbook",
  priceOneTime: 800,
  description:
    "Connect your own brokerage through Alpaca. When a pick is published, you get a message with an approve button — every trade waits for your one-tap approval, and nothing ever executes on its own.",
};

// Disclaimer strings from founding_architecture.txt §8. Keep these exact
// until the securities attorney finalizes wording.
export const DISCLAIMERS = {
  dashboardFooter:
    "Educational purposes only. Not investment advice. Trading involves risk of loss.",
  marketingFooter:
    "The Huddle is an educational and informational service. Nothing on this platform is investment advice or a recommendation to buy or sell any security. Trading securities involves substantial risk of loss, including the loss of your entire investment. Past performance does not guarantee future results. You are solely responsible for your own investment decisions.",
  riskAckOne:
    "I understand that The Huddle is an educational and informational service only. Nothing published on this platform constitutes investment advice, a recommendation to buy or sell any security, or an offer of any financial product.",
  riskAckTwo:
    "I understand that trading securities involves substantial risk of loss, including the potential loss of my entire investment. Past performance does not guarantee future results. I am solely responsible for my own investment decisions, and I will not hold The Huddle or its operators responsible for any losses I incur.",
};
