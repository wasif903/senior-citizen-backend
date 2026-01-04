import rateLimit from "express-rate-limit";

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  // 🔥 THIS IS THE KEY FIX
  validate: {
    xForwardedForHeader: false,
  },

  keyGenerator: (req) => {
    return req.ip; // real client IP (works with trust proxy)
  },
});

export default rateLimiter;
