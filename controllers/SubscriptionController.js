import Stripe from "stripe";
import SubscriptionModel from "../models/SubscriptionSchema.js";
import UserModel from "../models/UserSchema.js";
import PlanModel from "../models/PlanScheme.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleCreateSubscription = async (req, res) => {
  try {
    const { userId, planId, priceId, email, paymentMethodId, token } = req.body;

    if (!userId || !planId || !priceId || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const findUser = await UserModel.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const findPlan = await PlanModel.findById(planId);
    if (!findPlan) {
        return res.status(404).json({ message: "Plan not found" });
    }

    console.log(findUser.customerId, "customerId");

    // 1️⃣ Create or get Stripe customer
    let customerId = findUser.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      findUser.customerId = customer.id;
      await findUser.save();
      customerId = customer.id;
    }

    // 2️⃣ Create Payment Method (using token instead of card)
    let finalPaymentMethodId = paymentMethodId;
    if (!finalPaymentMethodId && token) {
      // Convert token (e.g., tok_visa) into a payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token } // 👈 use token here
      });
      console.log(paymentMethod.id, "---");
      finalPaymentMethodId = paymentMethod.id;
    }

    // 3️⃣ Attach the Payment Method to the Customer
    await stripe.paymentMethods.attach(finalPaymentMethodId, {
      customer: customerId
    });

    // 4️⃣ Set as Default Payment Method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: finalPaymentMethodId }
    });

    // 5️⃣ Create Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: finalPaymentMethodId,
      payment_behavior: "allow_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId, planId }
    });
// Confirm the payment intent manually
const paymentIntentId = subscription.latest_invoice.payment_intent?.id;

if (paymentIntentId) {
  const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });

  console.log("✅ Payment confirmed:", confirmedPaymentIntent.status);
} else {
  console.log("⚠️ No payment intent found yet");
}

    // await stripe.paymentIntents.confirm(paymentIntent.id);

    // 6️⃣ Save in DB
    await SubscriptionModel.create({
      userId,
      planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: findUser.customerId,
      status: subscription.status,
      startDate: subscription.start_date
        ? new Date(subscription.start_date * 1000)
        : null,
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000
      )
    });

    console.log("✅ Subscription created successfully:", subscription.id);

    return res.status(200).json({
      success: true,
      message: "Subscription created successfully",
      subscription
    });
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    res.status(500).json({ message: "Failed to create subscription", error });
  }
};


export const HandleGetPaymentIntent = async (req, res) => {
  try {
      const paymentIntent = await stripe.paymentIntents.create({
          amount: req.body.amount * 100,
          currency: 'usd',
          automatic_payment_methods: {
              enabled: true
          }
      })
      res.status(200).json({ getPaymentIntent: paymentIntent.client_secret });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
  }
}