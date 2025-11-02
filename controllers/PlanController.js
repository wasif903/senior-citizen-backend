import Stripe from "stripe";
import PlanModel from "../models/PlanScheme.js";
import stripe from "../config/StripeConfig.js";
import SearchQuery from "../utils/SearchQuery.js";

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

const handleGetPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || {};
    const matchStage = SearchQuery(search);

    const pipeline = [];

    if (matchStage) pipeline.push(matchStage);
    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const plans = await PlanModel.aggregate(pipeline);

    const countPipeline = [];
    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await PlanModel.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      plans,
      meta: {
        totalItems,
        totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export { createProductAndPrice, handleGetPlans };
