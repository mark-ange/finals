const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (error) {
  console.warn('Could not configure fallback DNS servers:', error.message);
}

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('MongoDB connection unavailable: MONGO_URI is not configured.');
    return null;
  }

  try {
    console.log('🔗 Attempting MongoDB connection...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Error: ${error.message}`);
    console.log('');
    console.log('🔧 Verify MONGO_URI, Atlas network access, and the database password.');
    return null;
  }
};

module.exports = connectDB;
