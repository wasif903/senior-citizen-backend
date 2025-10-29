import express from "express";

import validate from "../middlewares/ValidationHandler.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";
import { handleCreateSubscription } from "../controllers/SubscriptionController.js";

const router = express.Router();

router.post("/create-subscription", handleCreateSubscription);

export default router;
