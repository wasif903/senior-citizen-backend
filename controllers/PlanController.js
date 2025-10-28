import Stripe from "stripe";
import PlanModel from "../models/PlanScheme.js";
import stripe from "../config/StripeConfig.js";

const createProductAndPrice = async (req, res, next) => {
  try {
    const { title, amount, description } = req.body;

    // ✅ Validate input
    if (!title || !amount) {
      return res
        .status(400)
        .json({ message: "Title and amount are required fields." });
    }

    // ✅ Convert amount to cents
    const unitAmount = Math.round(amount * 100);

    // ✅ Create product on Stripe
    const product = await stripe.products.create({
      name: title,
      description
    });

    // ✅ Create yearly recurring price
    const price = await stripe.prices.create({
      unit_amount: unitAmount,
      currency: "usd",
      recurring: { interval: "year" },
      product: product.id
    });

    // ✅ Save to MongoDB
    const plan = new PlanModel({
      title,
      description,
      productId: product.id,
      priceId: price.id,
      amount: amount,
      currency: price.currency,
      interval: price.recurring.interval
    });

    await plan.save();

    res.status(201).json({
      message: "Product and yearly price created successfully",
      plan
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    next(error);
  }
};

export { createProductAndPrice };
