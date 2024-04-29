const setRateLimit = require("express-rate-limit");

const rateLimitMiddleware = setRateLimit({
  windowMs: 30 * 60 * 1000,
  max: 500,
  message: "Try again after some time",
  headers: true
});

module.exports = rateLimitMiddleware;