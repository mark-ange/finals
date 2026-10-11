/**
 * JWT Security Middleware for CityCare CDO Backend
 * Enhanced JWT token handling with refresh tokens and security validations
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token blacklist for revoked tokens (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Generate JWT Token with enhanced security
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {object} - Token and refresh token
 */
const generateTokens = (id, role) => {
  const jwtSecret = process.env.JWT_SECRET || 'citycare_super_secret_jwt_key_2026';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'citycare_refresh_secret_key_2026';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '90d';

  // Access token (short-lived for sensitive operations)
  const accessToken = jwt.sign(
    { id, role, type: 'access' },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  // Refresh token (long-lived for token renewal)
  const refreshToken = jwt.sign(
    { id, role, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

/**
 * Generate simple token (for compatibility with existing code)
 */
const generateToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || 'citycare_super_secret_jwt_key_2026';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpiresIn });
};

/**
 * Verify JWT Token with enhanced security checks
 */
const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }
    
    // Check token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'citycare_refresh_secret_key_2026';
  
  try {
    const decoded = jwt.verify(token, refreshSecret);
    
    if (tokenBlacklist.has(token)) {
      throw new Error('Refresh token has been revoked');
    }
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Middleware to verify JWT token
 */
const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET || 'citycare_super_secret_jwt_key_2026';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token, jwtSecret);
    
    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    req.user = user;
    req.token = token;
    req.authSource = 'jwt';
    next();
  } catch (error) {
    console.error('JWT Token Verification Failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired'
    });
  }
};

/**
 * Middleware to refresh JWT token
 */
const refreshJWT = async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(decoded.id, user.role);
    
    req.user = user;
    req.newTokens = tokens;
    next();
  } catch (error) {
    console.error('Refresh Token Verification Failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Middleware to check for admin role
 */
const checkAdmin = (req, res, next) => {
  if (req.user && (
    req.user.role === 'admin' ||
    req.user.role === 'clenro_officer' ||
    req.user.role === 'CLENRO Central Admin' ||
    req.user.role === 'CLENRO Staff'
  )) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required'
    });
  }
};

/**
 * Add token to blacklist (for logout)
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // In production, you would store this in Redis with TTL
  // For now, we'll just keep it in memory
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000); // Remove after 24 hours
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Enhanced token generation with user data
 */
const generateSecureToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || 'citycare_super_secret_jwt_key_2026';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    barangay: user.barangay,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

module.exports = {
  generateToken,
  generateTokens,
  generateSecureToken,
  verifyToken,
  verifyRefreshToken,
  verifyJWT,
  refreshJWT,
  checkAdmin,
  blacklistToken,
  isTokenBlacklisted
};
