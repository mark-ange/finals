const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const session = require('express-session');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Report = require('./models/Report');
const seedData = require('./seeder');
const {
  setSecurityHeaders,
  authLimiter,
  apiLimiter,
  sanitizeMongoDB,
  preventJsonInjection,
  getCorsOptions
} = require('./middleware/securityMiddleware');

// Load Firebase Admin (for mobile app token verification and FCM)
require('./config/firebase');

// Validate required environment variables
const validateEnvironment = () => {
  const requiredInProduction = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'MONGO_URI'
  ];
  
  const warnings = [];
  const errors = [];
  
  requiredInProduction.forEach(envVar => {
    if (!process.env[envVar]) {
      if (process.env.NODE_ENV === 'production') {
        errors.push(`Missing required environment variable: ${envVar}`);
      } else {
        warnings.push(`⚠️  WARNING: ${envVar} is not set. Using default fallback.`);
      }
    }
  });
  
  // Validate JWT secrets length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('⚠️  WARNING: JWT_SECRET should be at least 32 characters for security');
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    warnings.push('⚠️  WARNING: JWT_REFRESH_SECRET should be at least 32 characters for security');
  }
  
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    warnings.push('⚠️  WARNING: SESSION_SECRET should be at least 32 characters for security');
  }
  
  // Print warnings
  warnings.forEach(msg => console.warn(msg));
  
  // Print errors and exit if in production
  if (errors.length > 0) {
    console.error('\n🚨 CRITICAL: Missing required environment variables in production!');
    errors.forEach(msg => console.error(`  - ${msg}`));
    console.error('\nPlease set the missing environment variables and restart the server.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  return { valid: errors.length === 0, warnings, errors };
};

// Validate environment on startup
const envValidation = validateEnvironment();
if (!envValidation.valid && process.env.NODE_ENV === 'production') {
  process.exit(1);
}

const app = express();
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// ==========================================
// SECURITY MIDDLEWARE (ORDER MATTERS!)
// ==========================================

// 1. Security Headers (Helmet)
app.use(setSecurityHeaders);

// 2. Rate Limiting for API
app.use(apiLimiter);

// 3. Body parsing Middleware (with size limits)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 4. NoSQL Injection Protection
app.use(sanitizeMongoDB);

// 5. JSON Injection Protection
app.use(preventJsonInjection);

// 6. Session Middleware (for CSRF protection)
app.use(session({
  secret: process.env.SESSION_SECRET || 'citycare_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 7. Enhanced CORS Configuration
const corsOptions = {
  origin: getCorsOptions,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// CORS preflight handling
app.options('*', cors(corsOptions));

// Disable X-Powered-By header
app.disable('x-powered-by');

// Health Check API
app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ONLINE' : 'DEGRADED',
    database: databaseConnected ? 'CONNECTED' : 'UNAVAILABLE',
    system: 'CityCare CDO Unified Backend API (Web Admin & Mobile App)',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is unavailable. API data is not served or accepted until MongoDB reconnects.'
    });
  }
  return next();
});

// REST API Endpoints
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/barangays', require('./routes/barangayRoutes'));
app.use('/api/fleet', require('./routes/fleetRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('CityCare CDO Unified Node.js / Express & MongoDB Backend API Server is running.');
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Start server - MongoDB connection is non-blocking
const startServer = async () => {
  // Try to connect to MongoDB (but don't block server startup)
  connectDB().then(async (db) => {
    if (db) {
      console.log('✅ MongoDB Connected successfully');
      try {
        const reportsCount = await Report.countDocuments();
        if (reportsCount === 0) {
          console.log('🌱 Database is empty. Auto-seeding initial CityCare CDO records...');
          await seedData(false);
        }
      } catch (err) {
        console.log('Auto-seed check note:', err.message);
      }
    } else {
      console.error('⚠️  MongoDB connection failed. API requests will return HTTP 503 until MongoDB reconnects.');
    }
  }).catch((err) => {
    console.log('⚠️  MongoDB connection error:', err.message);
    console.error('API requests will return HTTP 503 until MongoDB reconnects.');
  });

  // Start the API listener while the database connects; database-dependent API calls remain unavailable.
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 CityCare Unified API Server running on port ${PORT}`);
    console.log(`📡 Local Web Portal endpoint: http://localhost:${PORT}`);
    console.log(`📱 Android Emulator endpoint: http://10.0.2.2:${PORT}`);
    console.log(`====================================================`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
};

startServer();
