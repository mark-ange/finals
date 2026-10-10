const express = require("express");

const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
} = require("../controllers/incidentController");

const router = express.Router();

router.get("/", getIncidents);

router.post("/", createIncident);

router.get("/:id", getIncidentById);

router.patch("/:id", updateIncident);

module.exports = router;