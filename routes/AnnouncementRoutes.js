import express from "express";

import validate from "../middlewares/ValidationHandler.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";
import { handleCreateAnnouncement, handleGetAnnouncement } from "../controllers/AnnouncementController.js";
import { CreateUploadMiddleware } from "../middlewares/MulterMiddleware.js";

const router = express.Router();

router.post("/:adminID/create-announcement",
    CreateUploadMiddleware([{ name: "img", isMultiple: false }]),
    handleCreateAnnouncement);
router.get("/get-announcement", handleGetAnnouncement);

export default router;
