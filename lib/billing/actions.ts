"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getStripe, ANNUAL_PRICE_ID } from "@/lib/stripe";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://vault.gaiaapp.net";

/** Ensure the profile has a Stripe customer; create one if needed. */
async function ensureCustomer(userId: string, email: string): Promise<string> {
  const db = await getDb();
  const profile = await db.getProfile(userId);
  if (profile?.stripeCustomerId) return profile.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  // Service role: write the customer id back (profiles RLS allows self-update,
  // but we may be off-session here, so use service for reliability).
  const svc = createSupabaseServiceClient();
  await svc.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

/** Start a Stripe Checkout for the annual plan. Redirects to Stripe. */
export async function startCheckout(): Promise<void> {
  const user = await requireUser();
  const customerId = await ensureCustomer(user.id, user.email ?? "");
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: ANNUAL_PRICE_ID(), quantity: 1 }],
    // Auto-renew is the Stripe default for subscriptions; disclosure copy is on
    // the billing page to meet consumer-law expectations.
    success_url: `${appUrl()}/account/billing?status=success`,
    cancel_url: `${appUrl()}/account/billing?status=cancelled`,
    allow_promotion_codes: true,
  });
  if (session.url) redirect(session.url);
}

/** Open the Stripe customer portal (manage / cancel / change payment). */
export async function openPortal(): Promise<void> {
  const user = await requireUser();
  const customerId = await ensureCustomer(user.id, user.email ?? "");
  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/account/billing`,
  });
  redirect(portal.url);
}
