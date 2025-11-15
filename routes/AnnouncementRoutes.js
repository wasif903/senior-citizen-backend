import express from "express";

import validate from "../middlewares/ValidationHandler.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";
import { handleCreateAnnouncement, handleGetAnnouncement } from "../controllers/AnnouncementController.js";

const router = express.Router();

router.post("/:adminID/create-announcement", handleCreateAnnouncement);
router.get("/get-announcement", handleGetAnnouncement);

export default router;
