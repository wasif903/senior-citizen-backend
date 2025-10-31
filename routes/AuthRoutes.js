import express from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  forgetPassword,
  verifyOtp,
  changePassword,
  HandleUpdateProfile,
  handleRegisterUser,
  handleGetUserProfile
} from "../controllers/AuthController.js";
import validate from "../middlewares/ValidationHandler.js";
import {
  loginSchema,
  adminSchema,
  userSchema
} from "../validations/AuthValidations.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";

const router = express.Router();

router.post("/register", validate(adminSchema), register);

router.post("/user-register", handleRegisterUser);

router.post(
  "/login",
  //  validate(loginSchema)
  login
);

router.post("/refresh", refreshToken);
router.post("/logout", logout);

router.patch("/forget-password", forgetPassword);

router.patch("/verify-otp", verifyOtp);

router.patch("/change-password", changePassword);

router.get("/get-profile/:id", handleGetUserProfile);

export default router;
