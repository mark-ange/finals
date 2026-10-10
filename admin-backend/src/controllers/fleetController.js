const Fleet = require("../models/Fleet");

const getFleet = async (req, res) => {
  try {
    const vehicles = await Fleet.find().sort({
      vehicleId: 1,
    });

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error(
      "Get fleet error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch fleet",
      error: error.message,
    });
  }
};

const createVehicle = async (req, res) => {
  try {
    const {
      vehicleId,
      plate,
      barangay,
      driver,
      status,
      position,
    } = req.body;

    if (
      !vehicleId ||
      !plate ||
      !barangay ||
      !driver
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle ID, plate, barangay, and driver are required",
      });
    }

    const cleanVehicleId =
      String(vehicleId).trim();

    const existingVehicle =
      await Fleet.findOne({
        vehicleId: {
          $regex: `^${cleanVehicleId}$`,
          $options: "i",
        },
      });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle ID already exists",
      });
    }

    const vehicle =
      await Fleet.create({
        vehicleId: cleanVehicleId,

        plate: String(plate).trim(),

        barangay:
          String(barangay).trim(),

        driver:
          String(driver).trim(),

        status:
          status || "Idle",

        position:
          position || {
            top: "50%",
            left: "50%",
          },
      });

    res.status(201).json({
      success: true,
      message:
        "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error(
      "Create vehicle error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to create vehicle",
      error: error.message,
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "vehicleId",
      "plate",
      "barangay",
      "driver",
      "status",
      "position",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (
        req.body[field] !== undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    if (
      updates.vehicleId !== undefined
    ) {
      updates.vehicleId = String(
        updates.vehicleId
      ).trim();
    }

    if (
      updates.plate !== undefined
    ) {
      updates.plate = String(
        updates.plate
      ).trim();
    }

    if (
      updates.barangay !== undefined
    ) {
      updates.barangay = String(
        updates.barangay
      ).trim();
    }

    if (
      updates.driver !== undefined
    ) {
      updates.driver = String(
        updates.driver
      ).trim();
    }

    const vehicle =
      await Fleet.findByIdAndUpdate(
        id,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message:
        "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error(
      "Update vehicle error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to update vehicle",
      error: error.message,
    });
  }
};

module.exports = {
  getFleet,
  createVehicle,
  updateVehicle,
};