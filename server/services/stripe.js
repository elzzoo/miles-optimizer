import Stripe from "stripe";

const SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const stripeConfigured = () => !!SECRET_KEY;

let _stripe = null;

export function getStripe() {
  if (!SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
  if (!_stripe) _stripe = new Stripe(SECRET_KEY, { apiVersion: "2024-06-20" });
  return _stripe;
}
