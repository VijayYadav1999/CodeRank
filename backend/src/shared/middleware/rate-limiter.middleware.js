/**
 * Rate Limiter Middleware
 */

const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

const globalRateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1', // Skip rate limit for localhost
  keyGenerator: (req) => {
    // Use X-Forwarded-For header when behind proxy, fallback to ip
    return req.headers['x-forwarded-for'] || req.ip;
  },
  trustProxy: false, // Disable trust proxy for rate limiting security
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip;
  },
  trustProxy: false,
});

const codeExecutionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 code executions per minute
  message: 'Too many code execution requests',
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip;
  },
  trustProxy: false,
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  codeExecutionRateLimiter,
};
