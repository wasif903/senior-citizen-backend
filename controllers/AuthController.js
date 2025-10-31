import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  generateOTP
} from "../utils/TokenGenerator.js";
import AdminModel from "../models/AdminSchema.js";
import autoMailer from "../utils/AutoMailer.js";
import mongoose from "mongoose";
import UserModel from "../models/UserSchema.js";
import stripe from "../config/StripeConfig.js";
import SubscriptionModel from "../models/SubscriptionSchema.js";
import PlanModel from "../models/PlanScheme.js";

// REGISTER
// METHOD : POST
// ENDPOINT: /api/register
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await AdminModel.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new AdminModel({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    const userDetails = {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      _id: newUser._id,
      createdAt: newUser.createdAt
    };

    // Return tokens
    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: userDetails
    });
  } catch (err) {
    next(err);
  }
};

// REGISTER
// METHOD : POST
// ENDPOINT: /api/user-register
const handleRegisterUser = async (req, res, next) => {
  try {
    const {
      username,
      email,
      idCardNumber,
      medicareNumber,
      dob,
      address,
      gender,
      bloodGroup,
      pastInjury,
      pastOperation,
      medicines,
      healthNote,
      password,
      fcmToken,
      deviceType,
      deviceName
    } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ username }, { email }, { idCardNumber }, { medicareNumber }]
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      username,
      email,
      idCardNumber,
      medicareNumber,
      dob,
      address,
      gender,
      bloodGroup,
      pastInjury,
      pastOperation,
      medicines,
      healthNote,
      password: hashedPassword
    });
    await newUser.save();

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.sessions = [
      {
        fcmToken,
        refreshToken,
        deviceType: deviceType || "unknown",
        deviceName: deviceName || req.headers["user-agent"],
        createdAt: new Date()
      }
    ];

    const customerId = await stripe.customers.create({
      email: email,
      name: username,
      metadata: { userId: newUser._id.toString() }
    });

    newUser.customerId = customerId.id;
    await newUser.save();

    const userDetails = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      idCardNumber: newUser.idCardNumber,
      medicareNumber: newUser.medicareNumber,
      dob: newUser.dob,
      address: newUser.address,
      gender: newUser.gender,
      bloodGroup: newUser.bloodGroup,
      pastInjury: newUser.pastInjury,
      pastOperation: newUser.pastOperation,
      medicines: newUser.medicines,
      healthNote: newUser.healthNote
    };

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: userDetails
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// LOGIN
// METHOD : POST
// ENDPOINT: /api/login
const login = async (req, res, next) => {
  try {
    const { identifier, password, fcmToken, deviceType, deviceName } = req.body;

    const user =
      (await AdminModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      }));

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    let details;

    if (user.role.includes("Admin")) {
      user.refreshToken = refreshToken;
      await user.save();

      details = {
        username: user.username,
        email: user.email,
        role: user.role,
        _id: user._id,
        createdAt: user.createdAt
      };
    } else if (user.role.includes("User")) {
      // 4️⃣ Save refresh token & session info
      // Assuming user.sessions is an array of active sessions

      if (!user.sessions) user.sessions = [];
      const sessionData = {
        refreshToken,
        fcmToken: fcmToken || null,
        deviceType: deviceType || "unknown",
        deviceName: deviceName || "unknown",
        createdAt: new Date()
      };
      user.sessions.push(sessionData);

      // user.refreshToken = refreshToken;
      await user.save();

      const findSubscription = await SubscriptionModel.findOne({
        userId: user._id
      });

      let subscribedPlan;
      if (findSubscription) {
        const findPlan = await PlanModel.findOne({
          _id: findSubscription.planId
        });
        subscribedPlan = {
          subscription: findSubscription,
          plan: findPlan
        };
      } else {
        subscribedPlan = null;
      }

      details = {
        _id: user._id,
        username: user.username,
        email: user.email,
        idCardNumber: user.idCardNumber,
        medicareNumber: user.medicareNumber,
        dob: user.dob,
        address: user.address,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        pastInjury: user.pastInjury,
        pastOperation: user.pastOperation,
        medicines: user.medicines,
        healthNote: user.healthNote,
        createdAt: user.createdAt,
        subscribedPlan
      };
    }

    res.status(200).json({ accessToken, refreshToken, user: details });
  } catch (err) {
    next(err);
  }
};

// REFRESH
// METHOD : POST
// ENDPOINT: /api/refresh
const refreshToken = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(403).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user =
      (await AdminModel.findById(decoded.id)) ||
      (await UserModel.findById(decoded.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "Admin") {
      if (user.refreshToken === token) {
        const accessToken = generateAccessToken(user);
        return res.status(200).json({ accessToken });
      } else {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
    } else if (user.role === "User") {
      // ✅ Check if token exists in any session
      const session = user.sessions.find(s => s.refreshToken === token);
      if (!session) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
      const accessToken = generateAccessToken(user);
      return res.status(200).json({ accessToken });
    } else {
      res.status(400).json({ message: "Invalid Request" });
    }
  } catch (err) {
    // res.status(403).json({ message: "Invalid refresh token" });
    next(err);
  }
};

// LOGOUT (Invalidate refresh token)
// METHOD : POST
// ENDPOINT: /api/logout
const logout = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user =
      (await AdminModel.findById(decoded.id)) ||
      (await UserModel.findById(decoded.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "Admin") {
      user.refreshToken = "";
      await user.save();
      return res.status(200).json({ message: "Logged out successfully" });
    } else if (user.role === "User") {
      user.sessions = user.sessions.filter(s => s.refreshToken !== token);
      await user.save();
      return res.status(200).json({ message: "Logged out successfully" });
    } else {
      res.status(400).json({ message: "Invalid refresh token" });
    }
  } catch (err) {
    // res.status(403).json({ message: "Invalid refresh token" });
    next(err);
  }
};

// FORGET PASSWORD
// METHOD: POST
// ENDPOINT: /api/forget-password
const forgetPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user =
      (await AdminModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      }));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    autoMailer({
      to: user.email,
      subject: "Password Reset OTP",
      message: `<p>Your OTP for password reset is: <b>${otp}</b>. It will expire in 10 minutes.</p>`
    });

    res.status(200).json({ message: "OTP sent to your email.", identifier });
  } catch (err) {
    next(err);
  }
};

// VERIFY OTP
// METHOD: POST
// ENDPOINT: /api/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    const user =
      (await AdminModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      }));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({ message: "No OTP requested." });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    if (user.otpExpire < new Date()) {
      return res.status(400).json({ message: "OTP expired." });
    }
    res.status(200).json({ message: "OTP verified.", identifier, otp });
  } catch (err) {
    next(err);
  }
};

// CHANGE PASSWORD
// METHOD: POST
// ENDPOINT: /api/change-password
const changePassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    const user =
      (await AdminModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      }));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({ message: "No OTP requested." });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    if (user.otpExpire < new Date()) {
      return res.status(400).json({ message: "OTP expired." });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpire = null;
    await user.save();
    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
};

// UPDATE PROFILE
// METHOD: PATCH
// ENDPOINT: /api/update-user/:id
const HandleUpdateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await AdminModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role.includes("Agency")) {
      return HandleUpdateAgency(req, res, next, user);
    } else if (user.role.includes("Operator")) {
      return HandleUpdateOperator(req, res, next, user);
    } else if (user.role.includes("Admin")) {
      return HandleUpdateAdmin(req, res, next, user);
    } else if (user.role.includes("User")) {
      return HandleUpdateUser(req, res, next, user);
    } else {
      return res.status(400).json({ message: "Bad Request" });
    }
  } catch (error) {
    next(error);
  }
};

// GET PROFILE
// METHOD: GET
// ENDPOINT: /api/get-profile/:id
const handleGetUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const findUser =
      (await UserModel.findById(id).select(
        "-sessions -password -otp -otpExpire"
      )) ||
      (await AdminModel.findById(id).select(
        "-password -otp -otpExpire -refreshToken"
      ));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({ user: findUser });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  logout,
  refreshToken,
  forgetPassword,
  verifyOtp,
  changePassword,
  HandleUpdateProfile,
  handleRegisterUser,
  handleGetUserProfile
};
