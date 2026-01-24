import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken, generateOTP } from "../utils/TokenGenerator.js";
import AdminModel from "../models/AdminSchema.js";
import autoMailer from "../utils/AutoMailer.js";
import mongoose from "mongoose";
import UserModel from "../models/UserSchema.js";
import stripe from "../config/StripeConfig.js";
import SubscriptionModel from "../models/SubscriptionSchema.js";
import PlanModel from "../models/PlanScheme.js";
import SearchQuery from "../utils/SearchQuery.js";
import ReminderModel from "../models/ReminderSchema.js";
import ExtractRelativeFilePath from "../middlewares/ExtractRelativePath.js";
import expressAsyncHandler from "express-async-handler";




// Phone Number
// ID Card Number
// Gender
// Blood Group
// Address




// REGISTER
// METHOD : POST
// ENDPOINT: /api/register
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await AdminModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new AdminModel({
      username,
      email,
      password: hashedPassword,
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
      createdAt: newUser.createdAt,
    };

    // Return tokens
    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: userDetails,
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
    const { username, email, idCardNumber, medicareNumber, dob, address, gender, bloodGroup, pastInjury, pastOperation, medicines, healthNote, password, fcmToken, deviceType, contactNumber, deviceName } = req.body;

    const medicareFile = req?.files?.medicareFile?.[0];

    let extractPath;
    if (medicareFile) {
      extractPath = ExtractRelativeFilePath(medicareFile);
      // return res.status(400).json({ message: "Medicare File is required!" });
    }

    const orConditions = [];

    if (username) orConditions.push({ username });
    if (email) orConditions.push({ email });
    if (idCardNumber) orConditions.push({ idCardNumber });
    if (medicareNumber) orConditions.push({ medicareNumber });

    const existingUser = await UserModel.findOne({
      $or: orConditions,
    });

    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists!" })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      username,
      email,
      contactNumber,
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
      medicare: extractPath,
      password: hashedPassword,
    });
    await newUser.save();


    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.sessions = [
      {
        fcmToken,
        refreshToken,
        deviceType: deviceType || "web",
        deviceName: deviceName || req.headers["user-agent"],
        createdAt: new Date(),
      },
    ];

    const customerId = await stripe.customers.create({
      email: email,
      name: username,
      metadata: { userId: newUser._id.toString() },
    });

    newUser.customerId = customerId.id;
    await newUser.save();

    const findSubscription = await SubscriptionModel.findOne({
      userId: newUser._id,
    });

    let subscribedPlan;
    if (findSubscription) {
      const findPlan = await PlanModel.findOne({
        _id: findSubscription.planId,
      });
      subscribedPlan = {
        subscription: findSubscription,
        plan: findPlan,
      };
    } else {
      subscribedPlan = null;
    }

    const userDetails = {
      _id: newUser._id,
      username: newUser.username,
      mood: newUser.mood,
      email: newUser.email,
      idCardNumber: newUser.idCardNumber,
      contactNumber: newUser.contactNumber,
      medicare: newUser.medicare,
      profilePicture: newUser.profilePicture,
      medicareNumber: newUser.medicareNumber,
      dob: newUser.dob,
      address: newUser.address,
      gender: newUser.gender,
      bloodGroup: newUser.bloodGroup,
      pastInjury: newUser.pastInjury,
      pastOperation: newUser.pastOperation,
      medicines: newUser.medicines,
      healthNote: newUser.healthNote,
      role: newUser.role,
      subscribedPlan,
    };

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: userDetails,
    });
  } catch (error) {
    console.log(error);
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        message: `A user with this ${field} already exists: ${value}`
      });
    }

    next(error);
  }
};

// const handleRegisterUser = expressAsyncHandler(async (req, res, next) => {
//   try {
//     console.log("🚀 Registration started");

//     // --- Destructure body ---
//     let { username, email, idCardNumber, medicareNumber, dob, address, gender, bloodGroup, pastInjury, pastOperation, medicines, healthNote, password, fcmToken, deviceType, contactNumber, deviceName } = req.body;

//     console.log("📦 Request body parsed", req.body);

//     // --- Trim input to avoid spaces issues ---
//     username = username?.trim();
//     email = email?.trim();
//     idCardNumber = idCardNumber?.trim();
//     medicareNumber = medicareNumber?.trim();
//     contactNumber = contactNumber?.trim();

//     // --- Check uploaded file ---
//     const medicareFile = req?.files?.medicareFile?.[0];
//     if (!medicareFile) {
//       console.log("❌ No medicare file uploaded");
//       return res.status(400).json({ message: "Medicare File is required!" });
//     }
//     console.log("🗂 Uploaded medicareFile:", medicareFile);

//     // --- Extract relative file path ---
//     const extractPath = ExtractRelativeFilePath(medicareFile);
//     console.log("✅ Extracted medicare path:", extractPath);

//     const check2 = await UserModel.find();

//     console.log("check2", check2);

//     // --- Check if user already exists ---
//     console.log("🔍 Checking existing user in DB...");
//     let existingUser;
//     try {
//       existingUser = await UserModel.findOne({
//         $or: [{ username }, { email }, { idCardNumber }, { medicareNumber }],
//       });
//       console.log("🔍 Existing user found:", existingUser);
//       if (existingUser) {
//         return res.status(400).json({ message: "Username, email, ID card, or Medicare number already taken" });
//       }
//     } catch (err) {
//       console.error("❌ MongoDB query failed:", err.stack);
//       return res.status(500).json({ message: "Database query failed" });
//     }

//     // --- Hash password ---
//     console.log("🔑 Hashing password...");
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // --- Create new user ---
//     console.log("🆕 Creating new user...");
//     let newUser;
//     try {
//       newUser = new UserModel({
//         username,
//         email,
//         contactNumber,
//         idCardNumber,
//         medicareNumber,
//         dob,
//         address,
//         gender,
//         bloodGroup,
//         pastInjury,
//         pastOperation,
//         medicines,
//         healthNote,
//         medicare: extractPath,
//         password: hashedPassword,
//       });
//       await newUser.save();
//       console.log("✅ User saved to DB:", newUser._id);
//     } catch (err) {
//       console.error("❌ Failed to save user:", err.stack);
//       return res.status(500).json({ message: "Failed to save user" });
//     }

//     // --- Generate tokens ---
//     console.log("📝 Generating access and refresh tokens...");
//     const accessToken = generateAccessToken(newUser);
//     const refreshToken = generateRefreshToken(newUser);

//     // --- Save session info ---
//     newUser.sessions = [
//       {
//         fcmToken,
//         refreshToken,
//         deviceType: deviceType || "web",
//         deviceName: deviceName || req.headers["user-agent"],
//         createdAt: new Date(),
//       },
//     ];

//     // --- Create Stripe customer ---
//     console.log("💳 Creating Stripe customer...");
//     try {
//       const customer = await stripe.customers.create({
//         email,
//         name: username,
//         metadata: { userId: newUser._id.toString() },
//       });
//       newUser.customerId = customer.id;
//       await newUser.save();
//       console.log("✅ Stripe customer created:", customer.id);
//     } catch (err) {
//       console.error("❌ Stripe customer creation failed:", err.stack);
//       // continue without blocking registration
//     }

//     // --- Check subscription ---
//     console.log("🔔 Checking subscriptions...");
//     let subscribedPlan = null;
//     try {
//       const subscription = await SubscriptionModel.findOne({ userId: newUser._id });
//       if (subscription) {
//         const plan = await PlanModel.findOne({ _id: subscription.planId });
//         subscribedPlan = { subscription, plan };
//       }
//     } catch (err) {
//       console.error("❌ Subscription lookup failed:", err.stack);
//     }

//     // --- Prepare response user object ---
//     const userDetails = {
//       _id: newUser._id,
//       username: newUser.username,
//       email: newUser.email,
//       idCardNumber: newUser.idCardNumber,
//       contactNumber: newUser.contactNumber,
//       medicare: newUser.medicare,
//       medicareNumber: newUser.medicareNumber,
//       dob: newUser.dob,
//       address: newUser.address,
//       gender: newUser.gender,
//       bloodGroup: newUser.bloodGroup,
//       pastInjury: newUser.pastInjury,
//       pastOperation: newUser.pastOperation,
//       medicines: newUser.medicines,
//       healthNote: newUser.healthNote,
//       role: newUser.role,
//       subscribedPlan,
//     };

//     console.log("✅ Registration complete for user:", newUser._id);

//     // --- Send response ---
//     return res.status(201).json({
//       message: "User registered successfully",
//       accessToken,
//       refreshToken,
//       user: userDetails,
//     });
//   } catch (error) {
//     console.error("❌ Registration failed:", error.stack);
//     next(error);
//   }
// });

// LOGIN
// METHOD : POST
// ENDPOINT: /api/login
const login = async (req, res, next) => {
  try {
    const { identifier, password, fcmToken, deviceType, deviceName } = req.body;

    const user =
      (await AdminModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
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
        createdAt: user.createdAt,
      };
    } else if (user.role.includes("User")) {
      // 4️⃣ Save refresh token & session info
      // Assuming user.sessions is an array of active sessions

      if (!user.sessions) user.sessions = [];
      const sessionData = {
        refreshToken,
        fcmToken: fcmToken || null,
        deviceType: deviceType || "web",
        deviceName: deviceName || "web",
        createdAt: new Date(),
      };
      user.sessions.push(sessionData);

      // user.refreshToken = refreshToken;
      await user.save();

      const findSubscription = await SubscriptionModel.findOne({
        userId: user._id,
      });

      let subscribedPlan;
      if (findSubscription) {
        const findPlan = await PlanModel.findOne({
          _id: findSubscription.planId,
        });
        subscribedPlan = {
          subscription: findSubscription,
          plan: findPlan,
        };
      } else {
        subscribedPlan = null;
      }

      details = {
        _id: user._id,
        username: user.username,
        mood: user.mood,
        email: user.email,
        idCardNumber: user.idCardNumber,
        medicareNumber: user.medicareNumber,
        profilePicture: user.profilePicture,
        medicare: user.medicare,
        dob: user.dob,
        address: user.address,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        pastInjury: user.pastInjury,
        pastOperation: user.pastOperation,
        medicines: user.medicines,
        healthNote: user.healthNote,
        createdAt: user.createdAt,
        role: user.role,
        subscribedPlan,
      };
    }

    res.status(200).json({
      message: "Logged In Successfully",
      accessToken,
      refreshToken,
      user: details,
    });
  } catch (err) {
    console.log(err);
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

    const user = (await AdminModel.findById(decoded.id)) || (await UserModel.findById(decoded.id));

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
      const session = user.sessions.find((s) => s.refreshToken === token);
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

    const user = (await AdminModel.findById(decoded.id)) || (await UserModel.findById(decoded.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "Admin") {
      user.refreshToken = "";
      await user.save();
      return res.status(200).json({ message: "Logged out successfully" });
    } else if (user.role === "User") {
      user.sessions = user.sessions.filter((s) => s.refreshToken !== token);
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
        $or: [{ email: identifier }, { username: identifier }],
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
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
      message: `<p>Your OTP for password reset is: <b>${otp}</b>. It will expire in 10 minutes.</p>`,
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
        $or: [{ email: identifier }, { username: identifier }],
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
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
        $or: [{ email: identifier }, { username: identifier }],
      })) ||
      (await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
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

    const user = (await AdminModel.findById(id)) || (await UserModel.findById(id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let details;
    if (user.role === "Admin") {
      const { username, email, password, newPass } = req.body;

      // Build dynamic $or conditions
      const userOrConditions = [];
      if (username) userOrConditions.push({ username });
      if (email) userOrConditions.push({ email });

      const existingUser =
        (await AdminModel.findOne({
          _id: { $ne: id },
          $or: userOrConditions,
        })) ||
        (await UserModel.findOne({
          _id: { $ne: id },
          $or: userOrConditions,
        }));
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already taken" });
      }
      user.username = username;
      user.email = email;
      if (password && password !== "" && newPass && newPass !== "") {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Password is Incorrect" });
        }
        user.password = await bcrypt.hash(newPass, 10);
      }
      await user.save();

      details = {
        username: user.username,
        email: user.email,
        role: user.role,
        _id: user._id,
        createdAt: user.createdAt,
      };

      return res.status(200).json({ message: "Profile Updated Successfully", user: details });

    } else if (user.role === "User") {

      // helper to clean multipart/form-data values
      const clean = (v) =>
        typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

      // sanitize inputs
      const username = clean(req.body.username);
      const email = clean(req.body.email);
      const idCardNumber = clean(req.body.idCardNumber);
      const medicareNumber = clean(req.body.medicareNumber);
      const dob = clean(req.body.dob);
      const address = clean(req.body.address);
      const gender = clean(req.body.gender);
      const bloodGroup = clean(req.body.bloodGroup);
      const pastInjury = clean(req.body.pastInjury);
      const pastOperation = clean(req.body.pastOperation);
      const medicines = clean(req.body.medicines);
      const healthNote = clean(req.body.healthNote);
      const password = clean(req.body.password);
      const mood = clean(req.body.mood);

      const medicareFile = req?.files?.medicareFile?.[0];
      const profilePicture = req?.files?.profilePicture?.[0];

      // build $or ONLY if values exist
      const userOrConditions = [];
      if (username) userOrConditions.push({ username });
      if (email) userOrConditions.push({ email });
      if (idCardNumber) userOrConditions.push({ idCardNumber });
      if (medicareNumber) userOrConditions.push({ medicareNumber });

      let existingUser = null;

      if (userOrConditions.length > 0) {
        existingUser =
          (await UserModel.findOne({
            _id: { $ne: id },
            $or: userOrConditions,
          })) ||
          (await AdminModel.findOne({
            _id: { $ne: id },
            $or: userOrConditions,
          }));
      }

      if (existingUser) {
        return res.status(400).json({
          message: "Username or email already taken",
        });
      }

      // file updates
      if (medicareFile) {
        user.medicare = ExtractRelativeFilePath(medicareFile);
      }

      if (profilePicture) {
        user.profilePicture = ExtractRelativeFilePath(profilePicture);
      }

      // field updates
      if (username) user.username = username;
      if (email) user.email = email;
      if (idCardNumber) user.idCardNumber = idCardNumber;
      if (medicareNumber) user.medicareNumber = medicareNumber;
      if (dob) user.dob = dob;
      if (address) user.address = address;
      if (gender) user.gender = gender;
      if (bloodGroup) user.bloodGroup = bloodGroup;
      if (pastInjury) user.pastInjury = pastInjury;
      if (pastOperation) user.pastOperation = pastOperation;
      if (medicines) user.medicines = medicines;
      if (healthNote) user.healthNote = healthNote;
      if (mood) user.mood = mood;

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();

      // subscription info
      const findSubscription = await SubscriptionModel.findOne({
        userId: user._id,
      });

      let subscribedPlan = null;

      if (findSubscription) {
        const findPlan = await PlanModel.findOne({
          _id: findSubscription.planId,
        });

        subscribedPlan = {
          subscription: findSubscription,
          plan: findPlan,
        };
      }

      const details = {
        _id: user._id,
        username: user.username,
        mood: user.mood,
        email: user.email,
        idCardNumber: user.idCardNumber,
        medicareNumber: user.medicareNumber,
        medicare: user.medicare,
        profilePicture: user.profilePicture,
        dob: user.dob,
        address: user.address,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        pastInjury: user.pastInjury,
        pastOperation: user.pastOperation,
        medicines: user.medicines,
        healthNote: user.healthNote,
        createdAt: user.createdAt,
        mood: user.mood,
        subscribedPlan,
      };

      return res.status(200).json({
        message: "Profile Updated Successfully",
        user: details,
      });
    }
    else {
      res.status(400).json({ message: "Invalid Request" });
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
    const findUser = (await UserModel.findById(id).select("-sessions -password -otp -otpExpire")) || (await AdminModel.findById(id).select("-password -otp -otpExpire -refreshToken"));

    if (!findUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    if (findUser.role === "User") {
      const findSubscription = await SubscriptionModel.findOne({
        userId: findUser._id,
      });

      let subscribedPlan;
      if (findSubscription) {
        const findPlan = await PlanModel.findOne({
          _id: findSubscription.planId,
        });
        subscribedPlan = {
          subscription: findSubscription,
          plan: findPlan,
        };
      } else {
        subscribedPlan = null;
      }

      const details = {
        _id: findUser._id,
        username: findUser.username,
        mood: findUser.mood,
        email: findUser.email,
        idCardNumber: findUser.idCardNumber,
        contactNumber: findUser.contactNumber,
        medicare: findUser.medicare,
        profilePicture: findUser.profilePicture,
        medicareNumber: findUser.medicareNumber,
        dob: findUser.dob,
        address: findUser.address,
        gender: findUser.gender,
        bloodGroup: findUser.bloodGroup,
        pastInjury: findUser.pastInjury,
        pastOperation: findUser.pastOperation,
        medicines: findUser.medicines,
        healthNote: findUser.healthNote,
        createdAt: findUser.createdAt,
        medicare: findUser.medicare,
        profilePicture: findUser.profilePicture,
        role: findUser.role,
        subscribedPlan,
      };

      return res.status(200).json({ user: details });
    } else if (findUser.role === "Admin") {
      return res.status(200).json({ user: findUser });
    }
  } catch (error) {
    next(error);
  }
};

// GET USERS
// METHOD: GET
// ENDPOINT: /api/get-users
const handleGetUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || {};
    const matchStage = SearchQuery(search);

    const pipeline = [
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "userId",
          as: "subscription",
        },
      },
      {
        $unwind: {
          path: "$subscription",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "plans",
          localField: "subscription.planId",
          foreignField: "_id",
          as: "plan",
        },
      },

      {
        $unwind: {
          path: "$plan",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          mood: 1,
          email: 1,
          idCardNumber: 1,
          medicareNumber: 1,
          contactNumber: 1,
          medicare: 1,
          dob: 1,
          address: 1,
          gender: 1,
          bloodGroup: 1,
          pastInjury: 1,
          pastOperation: 1,
          medicines: 1,
          healthNote: 1,
          createdAt: 1,
          subscription: 1,
          plan: 1,
        },
      },
    ];

    if (matchStage) pipeline.push(matchStage);
    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const users = await UserModel.aggregate(pipeline);

    const countPipeline = [];
    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await UserModel.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      users,
      meta: {
        totalItems,
        totalPages,
        page,
        limit,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// GET DASHBOARD API
// METHOD: GET
// ENDPOINT: /api/:adminID/dashboard
const handleGetAdminDashboard = async (req, res, next) => {
  try {
    const { adminID } = req.params;

    const findAdmin = await AdminModel.findById(adminID);
    if (!findAdmin) {
      return res.status(400).json({ message: "Invalid params" });
    }

    // Total Users
    const totalUserPipeline = [{ $count: "totalItems" }];
    const totalUserCountRes = await UserModel.aggregate(totalUserPipeline);
    const totalUsers = totalUserCountRes.length > 0 ? totalUserCountRes[0].totalItems : 0;

    // Total Pricing Plans
    const totalPlanPipeline = [{ $count: "totalItems" }];
    const totalPlanCountRes = await PlanModel.aggregate(totalPlanPipeline);
    const totalPlans = totalPlanCountRes.length > 0 ? totalPlanCountRes[0].totalItems : 0;

    // Upcoming Reminders
    const currDateTime = new Date();
    const totalUpcomingReminders = [
      {
        $match: {
          appointmentDate: {
            $gte: currDateTime,
          },
        },
      },
      { $count: "totalItems" },
    ];
    const totalUpcomingRemindersCount = await ReminderModel.aggregate(totalUpcomingReminders);
    const UpcomingReminders = totalUpcomingRemindersCount.length > 0 ? totalUpcomingRemindersCount[0].totalItems : 0;

    // Total Reminders
    const totalReminders = [{ $count: "totalItems" }];
    const totalRemindersCount = await ReminderModel.aggregate(totalReminders);
    const Reminders = totalRemindersCount.length > 0 ? totalRemindersCount[0].totalItems : 0;

    res.status(200).json({
      totalUsers: totalUsers,
      totalPlans: totalPlans,
      UpcomingReminders,
      totalReminders: Reminders,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PASSWORD
// METHOD : PATCH
// ENDPOINT: /api/id/update-password
const handleUpdatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, newPass } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    if (password && password !== "" && newPass && newPass !== "") {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Password is Incorrect" });
      }
      user.password = await bcrypt.hash(newPass, 10);
    }
    await user.save();
    return res.status(200).json({ message: "Password Updated Successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// UPDATE TIMEZONE
// METHOD : PATCH
// ENDPOINT: /api/update-timezone
const handleUpdateTimezone = async (req, res, next) => {
  try {
    const { refreshToken, timezone } = req.body;

    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const session = user.sessions.find((s) => s.refreshToken === refreshToken);
    if (!session) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    session.timezone = timezone;
    await session.save();

    res.status(200).json({ message: "Timezone Updated Successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


// DELETE USER
// METHOD : PATCH
// ENDPOINT: /api/:userId/delete-account
const handleDeleteAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const user = await UserModel.findOneAndDelete(
      { _id: userId }
    );

    if (!user) {
      return res.status(404).json({ message: "User Not Found or Already Deleted" });
    }

    await ReminderModel.deleteMany(
      { userId }
    );

    await SubscriptionModel.deleteMany(
      { userId: userId }
    )

    return res.status(200).json({
      message: "Your account has been deleted successfully",
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
};

export { register, login, logout, refreshToken, forgetPassword, verifyOtp, changePassword, HandleUpdateProfile, handleRegisterUser, handleGetUserProfile, handleGetUsers, handleGetAdminDashboard, handleUpdatePassword, handleUpdateTimezone, handleDeleteAccount };
