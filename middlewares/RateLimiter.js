import rateLimit from "express-rate-limit";

const RateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // trustProxy is NOT a valid option here - remove it
});

export default RateLimiter;