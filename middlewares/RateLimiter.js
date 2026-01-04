import rateLimit from "express-rate-limit";

const RateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator: (req) => ipKeyGenerator(req), // IPv6 safe
  trustProxy: true, // ✅ allows keyGenerator to read real client IP behind proxy
});

export default RateLimiter;
