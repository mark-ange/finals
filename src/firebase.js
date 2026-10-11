/**
 * Firebase Configuration for CityCare Admin Portal
 * This connects the Vue frontend to Firebase services
 * 
 * MANUAL ACTION REQUIRED:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project
 * 3. Go to Project Settings → General → Your apps
 * 4. Register a web app if not already done
 * 5. Copy the firebaseConfig object from there
 * 6. Replace the placeholder values below with your actual config
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase Configuration for CityCare CDO
const firebaseConfig = {
  apiKey: "AIzaSyCWKir9iFOeqZsKfM8BHUNbSpzk8E0RaqQ",
  authDomain: "citycarecdo.firebaseapp.com",
  projectId: "citycarecdo",
  storageBucket: "citycarecdo.firebasestorage.app",
  messagingSenderId: "705374451507",
  appId: "1:705374451507:web:123048017eb27cacc0b046",
  measurementId: "G-ZN3H2TTJZ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Authentication Methods
export const firebaseSignIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    return {
      user: userCredential.user,
      token: idToken,
      success: true
    };
  } catch (error) {
    console.error('Firebase sign in error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const firebaseSignOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Firebase sign out error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// Firestore Helpers
export const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const setDocument = async (collectionName, docId, data) => {
  await setDoc(doc(db, collectionName, docId), data);
};

export const updateDocument = async (collectionName, docId, data) => {
  await updateDoc(doc(db, collectionName, docId), data);
};

// Storage Helpers
export const uploadFile = async (path, file, metadata = {}) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
};

export const getFileUrl = async (path) => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

export const deleteFile = async (path) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// FCM Token Management
export const requestFCMPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY'
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('FCM permission error:', error);
    return null;
  }
};

export default app;
