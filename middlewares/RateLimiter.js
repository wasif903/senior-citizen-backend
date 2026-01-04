import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  // 🔥 Disable proxy header validation (you are behind Nginx)
  validate: {
    xForwardedForHeader: false,
  },

  // ✅ IPv4 + IPv6 safe
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
});

export default rateLimiter;
