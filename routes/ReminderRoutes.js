import express from "express";

import validate from "../middlewares/ValidationHandler.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";
import { handleCreateReminder } from "../controllers/ReminderController.js";

const router = express.Router();

router.post("/:userId/create-reminder", handleCreateReminder);

export default router;
