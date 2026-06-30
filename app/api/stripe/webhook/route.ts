import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

// Stripe needs the raw body to verify the signature.
export const runtime = "nodejs";

type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

function mapStatus(s: Stripe.Subscription.Status): { plan: "free" | "paid"; status: PlanStatus } {
  switch (s) {
    case "active":
    case "trialing":
      return { plan: "paid", status: s === "trialing" ? "trialing" : "active" };
    case "past_due":
    case "unpaid":
      return { plan: "paid", status: "past_due" };
    default:
      return { plan: "free", status: "canceled" };
  }
}

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "not configured" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();

  async function applyByCustomer(customerId: string, sub: Stripe.Subscription) {
    const { plan, status } = mapStatus(sub.status);
    await svc
      .from("profiles")
      .update({ plan, plan_status: status })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await applyByCustomer(String(sub.customer), sub);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.customer) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        await applyByCustomer(String(session.customer), sub);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
