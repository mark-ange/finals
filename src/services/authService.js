/**
 * Authentication Service for CityCare Admin Portal
 * Handles Firebase authentication for admin users
 * 
 * Usage in Vue components:
 *   import { signIn, signOut, getCurrentUser, onAuthChange } from '@/services/authService';
 */

import { 
  auth, 
  firebaseSignIn, 
  firebaseSignOut, 
  getCurrentUser 
} from '@/firebase';
import { ref } from 'vue';

// Current user state
const currentUser = ref(null);
const isLoading = ref(false);
const error = ref(null);

/**
 * Sign in with email and password (Firebase Auth)
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<object>} - User credential and token
 */
export const signIn = async (email, password) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const result = await firebaseSignIn(email, password);
    
    if (!result.success) {
      throw new Error(result.error || 'Sign in failed');
    }
    
    currentUser.value = result.user;
    isLoading.value = false;
    
    return {
      success: true,
      user: result.user,
      token: result.token
    };
  } catch (err) {
    isLoading.value = false;
    error.value = err.message || 'Sign in failed';
    throw err;
  }
};

/**
 * Sign out current user
 * @returns {Promise<object>} - Sign out result
 */
export const signOut = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const result = await firebaseSignOut();
    currentUser.value = null;
    isLoading.value = false;
    return result;
  } catch (err) {
    isLoading.value = false;
    error.value = err.message || 'Sign out failed';
    throw err;
  }
};

/**
 * Get current authenticated user
 * @returns {object|null} - Current user or null
 */
export const getUser = () => {
  return currentUser.value || getCurrentUser();
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  return currentUser.value !== null || getCurrentUser() !== null;
};

/**
 * Subscribe to authentication state changes
 * @param {function} callback - Callback function (user) => {}
 * @returns {function} - Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return auth.onAuthStateChanged((user) => {
    currentUser.value = user;
    if (callback) {
      callback(user);
    }
  });
};

/**
 * Get Firebase ID token for API requests
 * @returns {Promise<string|null>} - ID token or null
 */
export const getIdToken = async () => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  
  try {
    return await user.getIdToken();
  } catch (err) {
    console.error('Error getting ID token:', err);
    return null;
  }
};

/**
 * Refresh Firebase ID token
 * @returns {Promise<string|null>} - New ID token or null
 */
export const refreshToken = async () => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  
  try {
    await user.getIdToken(true); // Force refresh
    return await user.getIdToken();
  } catch (err) {
    console.error('Error refreshing token:', err);
    return null;
  }
};

/**
 * State getters
 */
export const getLoadingState = () => isLoading.value;
export const getError = () => error.value;

/**
 * Clear error
 */
export const clearError = () => {
  error.value = null;
};

// Export reactive state
export { currentUser, isLoading, error };
