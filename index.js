import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Middlewares
import ErrorHandler from "./middlewares/ErrorHandler.js";
import ErrorLogger from "./middlewares/ErrorLogger.js";
import RateLimiter from "./middlewares/RateLimiter.js";
import SecurityHeaders from "./middlewares/HelmetMiddleware.js";

// DB Connection
import connectDB from "./config/DB.js";


// Routes
import AuthRoutes from "./routes/AuthRoutes.js";
import { allowedOrigins } from "./utils/AllowedOrigins.js";

dotenv.config();

const app = express();

app.use(SecurityHeaders);

// === MongoDB Connection ===
connectDB();

// === Global Middlewares ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["POST", "GET", "PATCH", "DELETE"],
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
  res.status(200).json({ message: "OK!" })
})

// === Routes ===
app.use("/api", AuthRoutes);


// === Error Handler
app.use(ErrorHandler);

// === Server Start ===
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
