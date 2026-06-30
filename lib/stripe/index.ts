import "server-only";
import Stripe from "stripe";

/** Server-side Stripe client. Secret key is server-only. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export const ANNUAL_PRICE_ID = () => process.env.STRIPE_PRICE_ID_ANNUAL ?? "";
