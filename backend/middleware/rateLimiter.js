/**
 * In-Memory Rate Limiter Middleware
 * Limits requests per IP address using a sliding window counter.
 * No external dependencies (Redis/Upstash) required.
 *
 * Security context:
 *   - Verizon 2025 DBIR: stolen credentials = #1 breach vector
 *   - A single botnet can test millions of passwords/hour without rate limiting
 *   - This middleware is the first line of defense against credential stuffing
 */

// ── In-memory store: Map<ip, { count, resetAt }> ──
const ipStore = new Map();

// Cleanup expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore) {
    if (now > record.resetAt) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiter middleware.
 * @param {Object} options
 * @param {number} options.windowMs   - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.max        - Max requests allowed in the window (default: 10)
 * @param {string} options.message    - Response message when rate limited
 */
const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 10,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  return (req, res, next) => {
    // Extract client IP (supports proxies)
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
    const now = Date.now();

    let record = ipStore.get(ip);

    // If no record or window has expired, start a new window
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      ipStore.set(ip, record);
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': String(max - 1),
        'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
      });
      return next();
    }

    // Increment count
    record.count += 1;

    const remaining = Math.max(0, max - record.count);
    res.set({
      'X-RateLimit-Limit': String(max),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
    });

    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      console.warn(`🚫 Rate limit exceeded for IP ${ip}: ${record.count}/${max} in window`);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
};

// ── Pre-configured limiters ──

/** Login endpoint: max 10 requests per IP per minute */
const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,
  message: 'Too many login attempts from this IP. Please wait 1 minute and try again.',
});

/** OTP verification: max 10 per minute */
const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many verification attempts. Please wait 1 minute and try again.',
});

/** General auth endpoints: max 20 per minute */
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many requests. Please slow down.',
});

module.exports = {
  createRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  authRateLimiter,
};
