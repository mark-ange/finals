const mongoose = require("mongoose");

const barangaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    district: {
      type: String,
      enum: ["District 1", "District 2", "District 3"],
      default: "District 1",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // Existing barangay fields
    location: {
      type: String,
      default: "",
      trim: true,
    },

    captain: {
      type: String,
      default: "",
      trim: true,
    },

    contact: {
      type: String,
      default: "",
      trim: true,
    },

    population: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Barangay",
  barangaySchema,
  "barangays"
);