const Incident = require("../models/Incident");

const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createIncident = async (req, res) => {
  try {
    const incident = await Incident.create({
      ticketNumber: req.body.ticketNumber,
      barangay: req.body.barangay,
      category: req.body.category,
      description: req.body.description,
      location: req.body.location,
      status: req.body.status || "Pending",
      team: req.body.team,
      personnel: req.body.personnel,
      notes: req.body.notes,
    });

    res.status(201).json({
      success: true,
      message: "Incident created successfully",
      data: incident,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ticket number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =================================
   UPDATE INCIDENT
================================= */

const updateIncident = async (req, res) => {
  try {
    const allowedFields = [
      "team",
      "personnel",
      "status",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.json({
      success: true,
      message: "Incident updated successfully",
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
};