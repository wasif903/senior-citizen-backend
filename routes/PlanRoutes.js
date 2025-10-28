import express from "express";

import validate from "../middlewares/ValidationHandler.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";
import { createProductAndPrice } from "../controllers/PlanController.js";

const router = express.Router();

router.post("/create-plans", createProductAndPrice);

export default router;
