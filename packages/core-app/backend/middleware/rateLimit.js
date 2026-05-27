/**
 * Rate Limiting Middleware
 * 
 * - General API: 100 requests per 15 minutes
 * - Auth endpoints: 5 attempts per 15 minutes (stricter)
 * - Brute force protection: Account-level tracking
 */

const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../services/auditService');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMITED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator which handles IPv6 properly
  handler: (req, res, next, options) => {
    console.warn(`[Rate Limit] Exceeded for ${req.ip} on ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMITED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator which handles IPv6 properly
  handler: (req, res, next, options) => {
    const email = req.body?.email;
    console.warn(`[Auth Rate Limit] Exceeded for ${email || req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Stricter rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts. Please try again later.',
    code: 'RESET_RATE_LIMITED',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
  // Removed invalid 'keyHeaders' option
});

// Account-level brute force protection
// Tracks failed attempts per account (stored temporarily in memory)
// In production, use Redis for distributed tracking
const bruteForceAttempts = new Map();

const bruteForceProtection = async (req, res, next) => {
  const email = req.body?.email;
  if (!email) return next();
  
  const key = email.toLowerCase();
  const attempts = bruteForceAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  
  // Check if account is locked
  if (attempts.count >= 10) {
    const lockDuration = 60 * 60 * 1000; // 1 hour
    const timeSinceFirstAttempt = Date.now() - attempts.firstAttempt;
    
    if (timeSinceFirstAttempt < lockDuration) {
      // Log security event
      await logSecurityEvent('BRUTE_FORCE_DETECTED', {
        email: key,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        attempts: attempts.count
      });
      
      return res.status(429).json({
        error: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: Math.ceil((lockDuration - timeSinceFirstAttempt) / 1000)
      });
    } else {
      // Reset counter after lock period
      bruteForceAttempts.delete(key);
    }
  }
  
  // Store attempts on request for increment on failure
  req.bruteForceKey = key;
  req.bruteForceAttempts = attempts;
  
  next();
};

// Increment brute force counter on failed login
const incrementBruteForce = (email) => {
  const key = email.toLowerCase();
  const existing = bruteForceAttempts.get(key);
  
  if (existing) {
    existing.count += 1;
    bruteForceAttempts.set(key, existing);
  } else {
    bruteForceAttempts.set(key, { count: 1, firstAttempt: Date.now() });
  }
  
  // Cleanup old entries periodically (entries older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [k, v] of bruteForceAttempts.entries()) {
    if (v.firstAttempt < oneHourAgo) {
      bruteForceAttempts.delete(k);
    }
  }
};

// Clear brute force counter on successful login
const clearBruteForce = (email) => {
  bruteForceAttempts.delete(email.toLowerCase());
};

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  bruteForceProtection,
  incrementBruteForce,
  clearBruteForce
};
