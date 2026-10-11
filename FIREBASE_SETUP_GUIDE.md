# Firebase Integration Setup Guide

## ✅ WHAT I'VE DONE FOR YOU

I've created all the necessary files and installed dependencies to connect your **Vue Admin Portal** and **Node.js Backend** to Firebase. Your mobile app is already connected, so these files complete your system architecture.

### Files Created:

| File | Purpose |
|------|---------|
| `src/firebase.js` | Firebase client configuration for Vue frontend |
| `backend/config/firebase.js` | Firebase Admin configuration for Node.js backend |
| `backend/config/serviceAccountKey.json` | **PLACEHOLDER** - Replace with your real service account key |
| `backend/middleware/firebaseMiddleware.js` | Middleware to verify Firebase tokens |
| `backend/services/fcmService.js` | Service to send FCM push notifications |
| `src/services/authService.js` | Frontend authentication service with Vue |

### Files Modified:

| File | Changes |
|------|---------|
| `backend/server.js` | Added Firebase config loading |
| `backend/middleware/authMiddleware.js` | Now supports both Firebase and JWT tokens |
| `src/router/index.js` | Updated to support Firebase token authentication |
| `.gitignore` | Added `backend/config/serviceAccountKey.json` to exclude from Git |
| `package.json` (main) | Added `firebase@^13.0.0` dependency |
| `package.json` (backend) | Already has `firebase` and `firebase-admin` dependencies |

---

## 📋 MANUAL ACTIONS YOU MUST COMPLETE

### 1️⃣ **Get Firebase Service Account Key for Backend**

⚠️ **CRITICAL** - The current `serviceAccountKey.json` is a **PLACEHOLDER** and will NOT work!

1. In Firebase Console, go to **⚙️ Project settings** → **Service accounts** tab
2. Click **"Generate new private key"** button
3. Save the downloaded JSON file as `serviceAccountKey.json`
4. Place it in: `backend/config/serviceAccountKey.json`
5. **Replace the existing placeholder file**

✅ **Already Done**: The file path exists and is added to `.gitignore`

---

### 2️⃣ **Get Firebase Service Account Key for Backend**

⚠️ **CRITICAL** - The current `serviceAccountKey.json` is a **PLACEHOLDER** and will NOT work!

1. In Firebase Console, go to **⚙️ Project settings** → **Service accounts** tab
2. Click **"Generate new private key"** button
3. Save the downloaded JSON file as `serviceAccountKey.json`
4. Place it in: `backend/config/serviceAccountKey.json`
5. **Replace the existing placeholder file**

✅ **Already Done**: The file path exists and is added to `.gitignore`

⚠️ **IMPORTANT**: Keep this file **SECRET** and **DO NOT** commit it to GitHub. It's already in `.gitignore`.

---

### 3️⃣ **Enable Required Firebase Services**

In Firebase Console, make sure these are enabled:

- ✅ **Authentication** - For admin login
- ✅ **Cloud Messaging (FCM)** - For push notifications  
- ✅ **Cloud Storage** - For photo uploads (if backend needs access)

---

### 4️⃣ **Test Your Setup**

In Firebase Console, make sure these are enabled:

- ✅ **Authentication** - For admin login
- ✅ **Cloud Messaging (FCM)** - For push notifications
- ✅ **Cloud Storage** - For photo uploads (if backend needs access)

---

## 🚀 USAGE IN YOUR CODE

### Frontend (Vue Admin Portal)

#### Login Page Example:
```vue
<script setup>
import { ref } from 'vue';
import { signIn } from '@/services/authService';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  try {
    const result = await signIn(email.value, password.value);
    if (result.success) {
      // Save token to localStorage for API requests
      localStorage.setItem('firebaseToken', result.token);
      router.push('/dashboard');
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};
</script>
```

#### API Requests with Firebase Token:
```javascript
import { getIdToken } from '@/services/authService';

const fetchData = async () => {
  const token = await getIdToken();
  
  const response = await fetch('http://localhost:5000/api/reports', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Backend (Node.js)

#### Using Firebase Token Verification:
```javascript
// In your routes, the protect middleware now handles both Firebase and JWT
const { protect } = require('../middleware/authMiddleware');

// This will work with Firebase tokens from mobile AND JWT tokens from web admin
router.get('/api/reports', protect, async (req, res) => {
  // req.user contains the authenticated user info
  // req.firebaseUser contains Firebase decoded token (for mobile users)
  // req.authSource tells you if it was 'firebase' or 'jwt'
  
  if (req.authSource === 'firebase') {
    // Request came from mobile app
    console.log('Mobile user:', req.firebaseUser.uid);
  } else {
    // Request came from web admin (JWT)
    console.log('Admin user:', req.user.email);
  }
  
  res.json({ success: true, data: [] });
});
```

#### Sending FCM Notifications:
```javascript
const { sendToDevice, sendToTopic } = require('../services/fcmService');

// Send to specific device
router.post('/api/send-notification', async (req, res) => {
  const { deviceToken, title, body } = req.body;
  
  try {
    const result = await sendToDevice(deviceToken, title, body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send to all residents
router.post('/api/broadcast', async (req, res) => {
  const { title, body } = req.body;
  
  try {
    const result = await sendToTopic('residents', title, body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 📊 ARCHITECTURE FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                        CITYCARE SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                                  │
│  Residents (Android App)                                       │
│       │                                                       │
│       ├── Firebase Auth → Login                             │
│       ├── Firebase Storage → Upload Photos                   │
│       └── FCM → Get device token                            │
│            │                                                   │
│            └── Sends token to Node.js backend               │
│                                                                  │
│  Node.js Server (REST API)                                    │
│       │                                                       │
│       ├── Firebase Admin → Verify mobile tokens              │
│       ├── JWT → Verify web admin tokens                     │
│       ├── FCM → Send push notifications                      │
│       └── MongoDB → Store reports, schedules, etc.            │
│            │                                                   │
│            └── Connects to both Firebase and MongoDB         │
│                                                                  │
│  Administrative Users (Web Portal - Vue)                      │
│       │                                                       │
│       └── Firebase Auth → Admin login                       │
│            │                                                   │
│            └── JWT tokens for API requests                  │
│                                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 TROUBLESHOOTING

### Common Issues:

#### 1. "Firebase Admin not initialized"
**Cause**: Missing `serviceAccountKey.json`
**Fix**: Download the service account key from Firebase Console and save it to `backend/config/serviceAccountKey.json`

#### 2. "Invalid Firebase ID token"
**Cause**: Mobile app not sending correct token, or token expired
**Fix**: Make sure mobile app sends the Firebase ID token in Authorization header: `Bearer <token>`

#### 3. "FCM token not registered"
**Cause**: Device token is invalid/expired
**Fix**: Mobile app should refresh its FCM token and re-register with backend

#### 4. "Permission denied" when accessing Firebase Storage
**Cause**: Service account doesn't have permissions
**Fix**: In Firebase Console, go to IAM & Admin → Check service account has "Firebase Admin" permissions

---

## 📚 API ENDPOINTS TO UPDATE

Your existing auth endpoints will now work with both Firebase and JWT:

| Endpoint | Works With | Notes |
|----------|-----------|-------|
| `POST /api/auth/login` | JWT | Web admin login |
| `POST /api/auth/admin-login` | JWT | Web admin login |
| `GET /api/auth/profile` | Both | Firebase or JWT |
| All other protected routes | Both | Uses `protect` middleware |

Mobile app should use Firebase Auth directly, not these endpoints.

---

## 🎉 NEXT STEPS

1. ✅ Install Firebase packages
2. ✅ Add Firebase config to frontend
3. ✅ Add service account key to backend
4. ✅ Enable Firebase services in console
5. ✅ Test mobile app → backend connection
6. ✅ Test admin portal login
7. ✅ Test FCM notifications

That's it! Your system architecture is now complete with Firebase integration.
