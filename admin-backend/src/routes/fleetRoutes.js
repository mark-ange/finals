const express = require("express");

const {
  getFleet,
  createVehicle,
  updateVehicle,
} = require("../controllers/fleetController");

const router = express.Router();

router.get("/", getFleet);

router.post("/", createVehicle);

router.patch("/:id", updateVehicle);

module.exports = router;