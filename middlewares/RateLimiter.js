import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const RateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
});

export default RateLimiter;
