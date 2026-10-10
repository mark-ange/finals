const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Report = require('./models/Report');
const seedData = require('./seeder');

// Load environment variables
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CityCare CDO Unified Backend API (Web Admin & Mobile App)',
    timestamp: new Date().toISOString()
  });
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

// Start server and check for initial auto-seed
const startServer = async () => {
  const db = await connectDB();

  if (db) {
    try {
      const reportsCount = await Report.countDocuments();
      if (reportsCount === 0) {
        console.log('🌱 Database is empty. Auto-seeding initial CityCare CDO records...');
        await seedData(false);
      }
    } catch (err) {
      console.log('Auto-seed check note:', err.message);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 CityCare Unified API Server running on port ${PORT}`);
    console.log(`📡 Local Web Portal endpoint: http://localhost:${PORT}`);
    console.log(`📱 Android Emulator endpoint: http://10.0.2.2:${PORT}`);
    console.log(`====================================================`);
  });
};

startServer();
