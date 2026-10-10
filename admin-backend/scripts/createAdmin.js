const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const readline = require("readline");
require("dotenv").config();

const Admin = require("../src/models/Admin");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    console.log("\n=================================");
    console.log("   CITYCARE ADMIN ACCOUNT SETUP");
    console.log("=================================\n");

    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const password = await ask("Admin password: ");
    const securityPin = (await ask("6-digit security PIN: ")).trim();

    if (!email || !password || !securityPin) {
      throw new Error("All fields are required.");
    }

    if (!/^\d{6}$/.test(securityPin)) {
      throw new Error("Security PIN must be exactly 6 digits.");
    }

    console.log("\nConnecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully.");

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("\nAn admin with this email already exists.");
      console.log("No new account was created.");
      return;
    }

    const admin = await Admin.create({
      email,
      password,
      securityPin,
      role: "CLENRO Central Admin",
    });

    console.log("\n=================================");
    console.log("       ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`MongoDB ID: ${admin._id}`);
    console.log("\nYou can now use this account to test Admin Login.");
  } catch (error) {
    console.error("\nAdmin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

createAdmin();