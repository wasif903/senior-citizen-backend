import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Middlewares
import ErrorHandler from "./middlewares/ErrorHandler.js";
import ErrorLogger from "./middlewares/ErrorLogger.js";
import RateLimiter from "./middlewares/RateLimiter.js";
import SecurityHeaders from "./middlewares/HelmetMiddleware.js";
import qs from "qs";

// DB Connection
import connectDB from "./config/DB.js";
import admin from "./config/firebase.js";

// App Connection
import { createServer } from "http";
import ngrok from "ngrok";

// Routes
import AuthRoutes from "./routes/AuthRoutes.js";
import PlanRoutes from "./routes/PlanRoutes.js";
import SubscripitonRoutes from "./routes/SubscripitonRoutes.js";
import ReminderRoutes from "./routes/ReminderRoutes.js";
import AnnouncementRoutes from "./routes/AnnouncementRoutes.js";
import WebhookRoutes from "./routes/WebhookRoutes.js";

import { allowedOrigins } from "./utils/AllowedOrigins.js";
import { handleStripeWebhook } from "./webhooks/StripeSubscriptionWebhook.js";

// Notification Cron
import "./crons/NotificationCron.js";

dotenv.config();

const app = express();

app.set("trust proxy", true);

const httpServer = createServer(app);

app.use(SecurityHeaders);

app.set("query parser", "extended");

// === MongoDB Connection ===
connectDB();

// Stripe Webhook
app.use("/api/stripe", WebhookRoutes);

// === Global Middlewares ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"]
  })
);

// === Security Header Middleware ===
app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  },
  express.static("uploads")
);

// === Rate Limiter
app.use(RateLimiter);

// === Logger Middleware for logging errors
app.use(ErrorLogger);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Health Ok!" });
});

// === Routes ===
app.use("/api", AuthRoutes);
app.use("/api/plans", PlanRoutes);
app.use("/api/subscriptions", SubscripitonRoutes);
app.use("/api/reminders", ReminderRoutes);
app.use("/api/announcement", AnnouncementRoutes);

// === Error Handler

app.use(ErrorHandler);

// === Server Start ===
// const PORT = process.env.PORT || 5000;

// httpServer.listen(PORT, async () => {
//   console.log(`Server running on http://localhost:${PORT}`);

//   if (process.env.USE_NGROK === "true") {
//     try {
//       const url = await ngrok.connect(PORT);
//       console.log(`ngrok tunnel: ${url}`);
//     } catch (err) {
//       console.error("Failed to start ngrok:", err);
//     }
//   }
// });

async function sendPushNotification(token, reminder) {
  try {
    console.log(reminder);
    await admin.messaging().send({
      token:
        "cg67ezt8ToW9QgzDwwHE7f:APA91bFHDXzN1Mow-NxY5BQYOtYmrIuMlRAYqAT5X4IfKNlw0xTHPEd89dr766UtBBTkToL2IPf7glTqQG_w53obhEdP0gP2XIT0iEi4swQmp9-DU-vBNTw",
      notification: {
        title: `Reminder`,
        body: `Your appointment is at`
      },
      data: {
        type: "reminder"
      }
    });
    console.log(
      `Notification sent to token ${"cg67ezt8ToW9QgzDwwHE7f:APA91bFHDXzN1Mow-NxY5BQYOtYmrIuMlRAYqAT5X4IfKNlw0xTHPEd89dr766UtBBTkToL2IPf7glTqQG_w53obhEdP0gP2XIT0iEi4swQmp9-DU-vBNTw"}`
    );
  } catch (err) {
    console.error("Error sending notification:", err.message);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server Running");
});