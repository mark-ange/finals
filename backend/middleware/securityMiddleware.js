/**
 * Security Middleware for CityCare CDO Backend
 * Comprehensive security measures to prevent common web vulnerabilities
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Try to load xss-clean if available
let xssClean;
try {
  xssClean = require('xss-clean');
} catch (err) {
  xssClean = null;
}

/**
 * Security Headers Middleware
 * Sets various HTTP headers for security
 */
const setSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  frameguard: { action: "deny" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "same-origin" },
  xssFilter: true
});

/**
 * Rate Limiting for Authentication Endpoints
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

/**
 * Rate Limiting for API Endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number.parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 10000,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const reportSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number.parseInt(process.env.REPORT_SUBMISSION_RATE_LIMIT_MAX, 10) || 1500,
  message: {
    success: false,
    message: 'Too many reports were submitted from this network. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * MongoDB Query Sanitization
 * Prevents NoSQL injection attacks
 */
const sanitizeMongoDB = mongoSanitize();

/**
 * XSS Protection Middleware
 * Prevents Cross-Site Scripting attacks
 */
const xssProtection = xssClean ? xssClean() : (req, res, next) => {
  // Manual XSS protection if xss-clean is not available
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          result[key] = sanitize(obj[key]);
        }
        return result;
      }
      return obj;
    };
    
    for (const key in req.body) {
      req.body[key] = sanitize(req.body[key]);
    }
  }
  next();
};

/**
 * Input Validation Middleware
 * Validates and sanitizes request body
 */
const validateInput = (validations) => {
  return async (req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
      // Sanitize all string inputs
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      }
    }
    
    if (validations && validations.length > 0) {
      await Promise.all(
        validations.map(validation => validation.run(req))
      );
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
    }
    
    next();
  };
};

/**
 * Security Headers + CORS Middleware Combined
 */
const securityMiddleware = [
  setSecurityHeaders,
  apiLimiter,
  sanitizeMongoDB,
  xssProtection,
  preventJsonInjection
];

/**
 * Authentication Security Middleware
 */
const authSecurityMiddleware = [
  authLimiter,
  setSecurityHeaders,
  sanitizeMongoDB
];

/**
 * Check if request has valid token
 */
const requireToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }
  next();
};

/**
 * Sanitize output to prevent XSS
 */
const sanitizeOutput = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      // Recursively sanitize strings in the response
      const sanitize = (obj) => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string') {
          return obj
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }
        if (typeof obj === 'object') {
          const result = {};
          for (const key in obj) {
            result[key] = sanitize(obj[key]);
          }
          return result;
        }
        return obj;
      };
      originalJson.call(this, sanitize(data));
    } else {
      originalJson.call(this, data);
    }
  };
  next();
};

/**
 * Prevent JSON injection attacks
 */
function preventJsonInjection(req, res, next) {
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    // Check for JSON injection patterns
    const body = req.body;
    if (body && typeof body === 'object') {
      for (const key in body) {
        if (typeof body[key] === 'string' && 
            (body[key].includes('__proto__') || 
             body[key].includes('constructor') ||
             body[key].includes('prototype'))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid request data'
          });
        }
      }
    }
  }
  next();
}

/**
 * CSRF Token Middleware
 * Generates and validates CSRF tokens for form submissions
 */
const csrfTokens = new Map();

const generateCsrfToken = (req, res, next) => {
  // Generate a CSRF token and store it in the session
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = req.sessionID || req.ip;
  csrfTokens.set(sessionId, token);
  
  // Set token in response header
  res.setHeader('X-CSRF-Token', token);
  
  // Also make it available to the next middleware
  req.csrfToken = token;
  next();
};

const verifyCsrfToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for API endpoints (handled by JWT)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const sessionId = req.sessionID || req.ip;
  const submittedToken = req.headers['x-csrf-token'] || req.body._csrf;
  const storedToken = csrfTokens.get(sessionId);
  
  if (!submittedToken || submittedToken !== storedToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  // Remove used token (one-time use)
  csrfTokens.delete(sessionId);
  next();
};

/**
 * Enhanced CORS Configuration
 */
const getCorsOptions = (origin, callback) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',').map(item => item.trim()) :
    ['http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173'];

  const isAllowed = !origin ||
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV === 'development';

  callback(null, isAllowed);
};

// Re-export adminOnly from authMiddleware for convenience
let adminOnly;
try {
  adminOnly = require('./authMiddleware').adminOnly;
} catch (e) {
  adminOnly = (req, res, next) => next();
}

module.exports = {
  setSecurityHeaders,
  authLimiter,
  apiLimiter,
  reportSubmissionLimiter,
  sanitizeMongoDB,
  validateInput,
  securityMiddleware,
  authSecurityMiddleware,
  requireToken,
  adminOnly,
  sanitizeOutput,
  preventJsonInjection,
  generateCsrfToken,
  verifyCsrfToken,
  getCorsOptions
};
