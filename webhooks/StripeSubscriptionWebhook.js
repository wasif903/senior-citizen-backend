import Stripe from "stripe";
import express from "express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = express.raw({ type: "application/json" }); // raw body required

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // ✅ Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle different event types
  switch (event.type) {
    case "invoice.payment_succeeded":
      const invoice = event.data.object;
      console.log("💰 Payment succeeded for invoice:", invoice.id);
      // TODO: mark user subscription as active
      break;

    case "customer.subscription.created":
      const subscription = event.data.object;
      console.log("🎉 Subscription created:", subscription.id);
      // TODO: save subscription details in your DB
      break;

    case "customer.subscription.deleted":
      console.log("⚠️ Subscription canceled:", event.data.object.id);
      // TODO: deactivate user subscription
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // ✅ Respond to Stripe
  res.status(200).json({ received: true });
};
