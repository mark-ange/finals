/**
 * Firebase Middleware for CityCare Backend
 * Handles Firebase ID token verification for mobile app requests
 * 
 * This middleware verifies Firebase ID tokens sent by the mobile app
 * and makes the decoded user information available in req.firebaseUser
 */

const { auth } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token from mobile app
 * 
 * Mobile app should send: Authorization: Bearer <firebase_id_token>
 * 
 * If token is valid:
 *   - req.firebaseUser contains the decoded Firebase user info
 *   - req.user is set to the Firebase UID
 *   - Next middleware/route handler is called
 * 
 * If token is invalid:
 *   - Returns 401 Unauthorized
 */
const verifyFirebaseToken = async (req, res, next) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No Firebase token provided - could be JWT token for admin
    // Pass through to next middleware (JWT verification)
    return next();
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  if (!idToken || idToken === 'undefined' || idToken === 'null') {
    return res.status(401).json({
      success: false,
      message: 'No Firebase ID token provided'
    });
  }
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Attach Firebase user info to request
    req.firebaseUser = decodedToken;
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false
    };
    
    // Add user info to request for logging
    req.firebaseTokenInfo = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      verified: true
    };
    
    console.log(`Firebase token verified for UID: ${decodedToken.uid}`);
    return next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    
    let message = 'Invalid or expired Firebase ID token';
    
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      message = 'Firebase token expired. Please refresh and try again.';
    } else if (error.code === 'auth/id-token-revoked') {
      message = 'Firebase token revoked. Please login again.';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid Firebase ID token format.';
    }
    
    return res.status(401).json({
      success: false,
      message: message,
      error: error.code
    });
  }
};

/**
 * Middleware to verify Firebase token AND ensure user is a resident
 * Use this for mobile-only endpoints
 */
const verifyFirebaseResident = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Firebase authentication required for mobile requests'
    });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({
      success: false,
      message: 'No Firebase ID token provided'
    });
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // For now, we assume all Firebase-authenticated users are residents
    // You can add additional checks here if you have custom claims
    req.firebaseUser = decodedToken;
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      role: 'resident' // Default role for mobile users
    };
    
    console.log(`Firebase resident verified: ${decodedToken.uid}`);
    return next();
  } catch (error) {
    console.error('Firebase resident verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired Firebase ID token',
      error: error.code
    });
  }
};

/**
 * Middleware to support BOTH Firebase and JWT tokens
 * This allows mobile (Firebase) and web admin (JWT) to work together
 */
const verifyFirebaseOrJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Check if it's a Firebase token (starts with Bearer)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    
    try {
      // First try Firebase verification
      const decodedToken = await auth.verifyIdToken(token);
      req.firebaseUser = decodedToken;
      req.user = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        role: 'resident'
      };
      req.authSource = 'firebase';
      return next();
    } catch (firebaseError) {
      // If Firebase fails, it might be a JWT token
      // Pass to next middleware (JWT verification)
      console.log('Not a Firebase token, trying JWT...');
      return next();
    }
  }
  
  // Not a Bearer token, pass to next middleware
  return next();
};

/**
 * Utility: Get Firebase user by UID
 */
const getFirebaseUser = async (uid) => {
  try {
    const { auth } = require('../config/firebase');
    return await auth.getUser(uid);
  } catch (error) {
    console.error('Error fetching Firebase user:', error.message);
    return null;
  }
};

module.exports = {
  verifyFirebaseToken,
  verifyFirebaseResident,
  verifyFirebaseOrJWT,
  getFirebaseUser
};
