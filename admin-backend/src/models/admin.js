const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    securityPin: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["CLENRO Central Admin", "CLENRO Staff"],
      default: "CLENRO Central Admin",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema, "admins");