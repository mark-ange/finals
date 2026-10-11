/**
 * Firebase Admin Configuration for CityCare Backend
 * This connects the Node.js backend to Firebase services
 */

const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

let serviceAccount;

try {
  // Try to require the service account key
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.warn('Firebase serviceAccountKey.json not found. Firebase Admin features will be limited.');
  serviceAccount = null;
}

// Initialize Firebase Admin if service account exists
let firebaseAdmin;
let authService;
let messagingService;
let storageService;
let firestoreService;

if (serviceAccount) {
  try {
    if (getApps().length === 0) {
      firebaseAdmin = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "citycarecdo.firebasestorage.app"
      });
    } else {
      firebaseAdmin = getApp();
    }
    authService = getAuth(firebaseAdmin);
    messagingService = getMessaging(firebaseAdmin);
    storageService = getStorage(firebaseAdmin);
    firestoreService = getFirestore(firebaseAdmin);
    console.log('✅ Firebase Admin initialized successfully for project: citycarecdo');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
    if (error.code === 'app/duplicate-app') {
      console.log('Firebase Admin already initialized');
      firebaseAdmin = getApp();
      authService = getAuth(firebaseAdmin);
      messagingService = getMessaging(firebaseAdmin);
      storageService = getStorage(firebaseAdmin);
      firestoreService = getFirestore(firebaseAdmin);
    } else {
      console.warn('Firebase Admin will not be available');
    }
  }
}

// Export Firebase Admin services only if initialized
const getAdmin = () => {
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin not initialized. Please check your service account key.');
  }
  return firebaseAdmin;
};

module.exports = {
  // Admin app instance
  get admin() {
    return getAdmin();
  },
  
  // Authentication
  auth: {
    verifyIdToken: async (idToken) => {
      if (!authService) {
        throw new Error('Firebase Admin not initialized');
      }
      return await authService.verifyIdToken(idToken);
    },
    getUser: async (uid) => {
      if (!authService) {
        throw new Error('Firebase Admin not initialized');
      }
      return await authService.getUser(uid);
    }
  },
  
  // Cloud Messaging (FCM)
  messaging: {
    send: async (message) => {
      if (!messagingService) {
        throw new Error('Firebase Admin not initialized');
      }
      return await messagingService.send(message);
    },
    sendToTopic: async (topic, message) => {
      if (!messagingService) {
        throw new Error('Firebase Admin not initialized');
      }
      return await messagingService.send({ ...message, topic });
    },
    sendToDevice: async (registrationToken, message) => {
      if (!messagingService) {
        throw new Error('Firebase Admin not initialized');
      }
      return await messagingService.send({ ...message, token: registrationToken });
    },
    sendEachForMulticast: async (messages) => {
      if (!messagingService) {
        throw new Error('Firebase Admin not initialized');
      }
      return await messagingService.sendEachForMulticast(messages);
    }
  },
  
  // Cloud Storage
  storage: {
    bucket: (name) => {
      if (!storageService) {
        throw new Error('Firebase Admin not initialized');
      }
      return storageService.bucket(name);
    },
    upload: async (filePath, destination, metadata = {}) => {
      if (!storageService) {
        throw new Error('Firebase Admin not initialized');
      }
      const bucket = storageService.bucket();
      const file = bucket.file(destination);
      return await file.save(filePath, metadata);
    },
    delete: async (filePath) => {
      if (!storageService) {
        throw new Error('Firebase Admin not initialized');
      }
      const bucket = storageService.bucket();
      const file = bucket.file(filePath);
      return await file.delete();
    },
    getDownloadUrl: async (filePath, options = { action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 }) => {
      if (!storageService) {
        throw new Error('Firebase Admin not initialized');
      }
      const bucket = storageService.bucket();
      const file = bucket.file(filePath);
      const [url] = await file.getSignedUrl(options);
      return url;
    }
  },
  
  // Firestore (if you want to use it alongside MongoDB)
  firestore: () => {
    if (!firestoreService) {
      throw new Error('Firebase Admin not initialized');
    }
    return firestoreService;
  }
};
