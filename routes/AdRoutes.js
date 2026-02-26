import express from "express";
import {
  handleCreateAd,
  handleDeleteAd,
  handleGetAllAds,
  handleGetSingleAd,
  handleUpdateAd,
} from "../controllers/AdController.js";
import { CreateUploadMiddleware } from "../middlewares/MulterMiddleware.js";

const router = express.Router();

router.post(
  "/",
  CreateUploadMiddleware([
    { name: "webImage", isMultiple: false },
    { name: "appImage", isMultiple: false },
  ]),
  handleCreateAd,
);
router.get("/", handleGetAllAds);
router.get("/:id", handleGetSingleAd);
router.patch(
  "/:id",
  CreateUploadMiddleware([
    { name: "webImage", isMultiple: false },
    { name: "appImage", isMultiple: false },
  ]),
  handleUpdateAd,
);
router.delete("/:id", handleDeleteAd);

export default router;
