import rateLimit from "express-rate-limit";

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  validate: {
    xForwardedForHeader: false,
  },

  // ✅ THIS STOPS THE IPv6 KEY GENERATOR ERROR
  ipv6Subnet: false,
});

export default rateLimiter;
