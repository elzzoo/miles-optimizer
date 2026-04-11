import { Router } from "express";
import { getStripe, stripeConfigured } from "../services/stripe.js";
import { createClient } from "../services/supabase.js";

const router = Router();

// ── POST /api/stripe/create-checkout ──────────────────────────────────────────
// Creates a Stripe Checkout Session for the Premium subscription
router.post("/create-checkout", async (req, res) => {
  if (!stripeConfigured()) {
    return res.status(503).json({ error: "Stripe non configuré" });
  }

  const priceId      = process.env.STRIPE_PRICE_ID;
  const successUrl   = `${process.env.APP_URL || "https://miles-optimizer-next-3y3m.onrender.com"}/premium?success=1`;
  const cancelUrl    = `${process.env.APP_URL || "https://miles-optimizer-next-3y3m.onrender.com"}/premium?canceled=1`;

  if (!priceId) {
    return res.status(500).json({ error: "STRIPE_PRICE_ID non configuré" });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode:          "subscription",
      payment_method_types: ["card"],
      line_items:    [{ price: priceId, quantity: 1 }],
      success_url:   successUrl,
      cancel_url:    cancelUrl,
      metadata:      { userId: req.body.userId || "" },
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("[stripe] create-checkout failed:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/stripe/webhook ───────────────────────────────────────────────────
// Handles Stripe webhook events — activates Premium in Supabase on payment
router.post("/webhook", async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !stripeConfigured()) {
    return res.status(503).json({ error: "Webhook non configuré" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (e) {
    console.error("[stripe] webhook signature failed:", e.message);
    return res.status(400).json({ error: `Webhook Error: ${e.message}` });
  }

  // Handle successful payment
  if (event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded") {
    const session    = event.data.object;
    const customerId = session.customer;
    const userId     = session.metadata?.userId;

    if (userId) {
      try {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .upsert({ id: userId, is_premium: true, stripe_customer_id: customerId, updated_at: new Date().toISOString() });
        console.log(`[stripe] Premium activated for user ${userId}`);
      } catch (e) {
        console.error("[stripe] failed to activate premium:", e.message);
      }
    }
  }

  // Handle cancellation / failed payment
  if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
    const subscription = event.data.object;
    const customerId   = subscription.customer;

    try {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ is_premium: false, updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);
      console.log(`[stripe] Premium deactivated for customer ${customerId}`);
    } catch (e) {
      console.error("[stripe] failed to deactivate premium:", e.message);
    }
  }

  res.json({ received: true });
});

export default router;
