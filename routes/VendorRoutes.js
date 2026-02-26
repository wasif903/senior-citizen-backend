import express from "express";
import {
  createVendor,
  deleteVendor,
  getAllVendors,
  getSingleVendor,
  updateVendor,
} from "../controllers/VendorController.js";
import { CreateUploadMiddleware } from "../middlewares/MulterMiddleware.js";

const router = express.Router();

// router.post(
//   "/user-register",
//   CreateUploadMiddleware([{ name: "medicareFile", isMultiple: false }]),
//   handleRegisterUser
// );

router.post(
  "/",
  CreateUploadMiddleware([{ name: "image", isMultiple: false }]),
  createVendor
);
router.get("/", getAllVendors);
router.get("/:id", getSingleVendor);
router.patch("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
