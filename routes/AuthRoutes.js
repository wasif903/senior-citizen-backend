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
  handleGetUserProfile,
  handleGetUsers,
  handleGetAdminDashboard
} from "../controllers/AuthController.js";
import validate from "../middlewares/ValidationHandler.js";
import {
  loginSchema,
  adminSchema,
  userSchema
} from "../validations/AuthValidations.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AccessMiddleware from "../middlewares/AccessMiddleware.js";
import { CreateUploadMiddleware } from "../middlewares/MulterMiddleware.js";

const router = express.Router();

router.post("/register", validate(adminSchema), register);

router.post(
  "/user-register",
  CreateUploadMiddleware([
    {
      name: "medicareFile",
      isMultiple: false
    }
  ]),
  handleRegisterUser
);

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

router.patch("/update-user/:id", HandleUpdateProfile);

router.get("/get-users", handleGetUsers);

router.get("/:adminID/dashboard", handleGetAdminDashboard);

export default router;

