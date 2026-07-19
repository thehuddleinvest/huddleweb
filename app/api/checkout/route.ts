import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { TIERS } from "@/lib/tiers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { tier } = (await req.json().catch(() => ({}))) as { tier?: string };
  const selected = TIERS.find((t) => t.id === tier);
  if (!selected) {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }

  // Must be a signed-in user (session cookie).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const stripe = getStripe();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Record the click-through risk acknowledgment (§2.2 / §8.1) + audit trail.
  await admin
    .from("users")
    .update({
      risk_ack_signup_at: new Date().toISOString(),
      risk_ack_signup_ip: ip,
    })
    .eq("id", user.id);

  await admin.from("audit_log").insert({
    actor_type: "user",
    actor_id: user.id,
    action: "risk_ack_signed",
    entity_type: "user",
    entity_id: user.id,
    metadata: { scope: "signup", tier: selected.id },
    ip_address: ip,
  });

  // Reuse an existing Stripe customer if we have one.
  const { data: profile } = await admin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: `The Huddle — ${selected.name}` },
          unit_amount: selected.priceMonthly * 100,
          recurring: { interval: "month" },
        },
      },
    ],
    subscription_data: { metadata: { user_id: user.id, tier: selected.id } },
    metadata: { user_id: user.id, tier: selected.id },
    success_url: `${site}/dashboard?welcome=1`,
    cancel_url: `${site}/sign-up?tier=${selected.id}&canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
