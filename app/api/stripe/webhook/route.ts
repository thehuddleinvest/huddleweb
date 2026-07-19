import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Our subscription_status enum only allows these four. Clamp anything else
// (incomplete, unpaid, paused, …) to a safe value so inserts never fail.
const ALLOWED = new Set(["trialing", "active", "past_due", "canceled"]);
function mapStatus(status: string): string {
  return ALLOWED.has(status) ? status : "past_due";
}

function iso(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, secret!);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier;
    const subId =
      typeof session.subscription === "string" ? session.subscription : null;

    if (userId && tier && subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          tier,
          stripe_subscription_id: subId,
          status: mapStatus(sub.status),
          current_period_start: iso(sub.current_period_start),
          current_period_end: iso(sub.current_period_end),
        },
        { onConflict: "stripe_subscription_id" }
      );

      await admin.from("audit_log").insert({
        actor_type: "system",
        actor_id: userId,
        action: "subscription_activated",
        entity_type: "subscription",
        entity_id: subId,
        metadata: { tier, status: sub.status },
      });
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    await admin
      .from("subscriptions")
      .update({
        status: mapStatus(sub.status),
        current_period_start: iso(sub.current_period_start),
        current_period_end: iso(sub.current_period_end),
        canceled_at: iso(sub.canceled_at),
      })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
