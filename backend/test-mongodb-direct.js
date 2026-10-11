/**
 * Test a MongoDB direct connection.
 * Run with MONGO_URI_DIRECT set in the environment.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const directURI = process.env.MONGO_URI_DIRECT;
if (!directURI) {
  console.error('MONGO_URI_DIRECT is not configured.');
  process.exit(1);
}

const connectDirect = async () => {
  try {
    console.log('🔗 Connecting to MongoDB using MONGO_URI_DIRECT...');
    const conn = await mongoose.connect(directURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log('✅ MongoDB Connected Successfully (Direct)!');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB Direct Connection FAILED');
    console.error(`   Error: ${error.message}`);
    process.exitCode = 1;
  }
};

connectDirect();
