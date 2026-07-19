import Stripe from "stripe";

// Lazy singleton. Instantiating at module load would run during the Vercel
// build (when STRIPE_SECRET_KEY may be absent) and throw. Construct on first
// use inside a request handler instead.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return client;
}
