import rateLimit from 'express-rate-limit';

/**
 * Helper to build custom rate limiters with JSON response standard matching KisanSetu backend.
 */
const createCustomLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes window
    max: options.max,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
      // Allow existing integration test suites to execute on localhost without hitting rate limits
      if (process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true') {
        return true;
      }
      return false;
    },
    handler: (req, res, next, options) => {
      res.status(options.statusCode || 429).json({
        success: false,
        message: options.message || 'Too many requests. Please try again later.'
      });
    },
    message: options.message || 'Too many requests. Please try again later.'
  });
};

/**
 * 1. Authentication Limiter
 * Protects login and registration against brute force and credential stuffing.
 * Configuration: 10 requests per 15 minutes per IP.
 */
export const authLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.'
});

/**
 * 2. Sensitive Write / API Limiter
 * Protects state-changing endpoints (booking, check-in, queue transitions, procurement, payments).
 * Configuration: 60 requests per 15 minutes per IP.
 */
export const sensitiveWriteLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many write requests. Please try again later.'
});

/**
 * 3. General API Limiter
 * Protects general API routes against denial-of-service or scraping.
 * Configuration: 300 requests per 15 minutes per IP.
 */
export const generalApiLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please try again later.'
});

/**
 * 4. Dedicated OTP Request Limiter
 * Protects SMS sending against abuse.
 * Configuration: 5 requests per 15 minutes per IP.
 */
export const otpLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please try again after 15 minutes.'
});

export default {
  authLimiter,
  sensitiveWriteLimiter,
  generalApiLimiter,
  otpLimiter
};
