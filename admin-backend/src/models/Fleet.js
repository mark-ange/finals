const mongoose = require("mongoose");

const fleetSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    plate: {
      type: String,
      required: true,
      trim: true,
    },

    barangay: {
      type: String,
      required: true,
      trim: true,
    },

    driver: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "In Transit",
        "Idle",
        "Maintenance",
      ],
      default: "Idle",
    },

    position: {
      top: {
        type: String,
        default: "50%",
      },

      left: {
        type: String,
        default: "50%",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Fleet",
  fleetSchema,
  "fleet"
);