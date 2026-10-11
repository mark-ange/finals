/**
 * Test MongoDB Connection
 * Run: node test-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Test');
console.log('=========================\n');

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('❌ MONGO_URI not found in .env file');
  console.log('Please add MONGO_URI to your .env file');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log('  - MONGO_URI:', mongoURI.split('@')[0] + '@...');
console.log('  - PORT:', process.env.PORT || 5000);
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log('');
    console.log('🎉 Connection test PASSED!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection FAILED');
    console.error(`   Error: ${error.message}`);
    console.log('');
    console.log('🔧 Troubleshooting Steps:');
    console.log('   1. Check your MongoDB Atlas connection string');
    console.log('   2. Verify your IP is whitelisted in MongoDB Atlas');
    console.log('   3. Ensure the password is correct');
    console.log('   4. Check network connectivity (can you ping google.com?)');
    console.log('   5. Verify the cluster name is correct');
    process.exit(1);
  }
};

connectDB();
