const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Fleet = require('../models/Fleet');
const memoryStore = require('../config/memoryStore');

// @route   GET /api/fleet
// @desc    Get all vehicles and drivers with status summary
// @access  Public
router.get('/', async (req, res) => {
  try {
    let trucks = [];

    if (mongoose.connection.readyState === 1) {
      trucks = await Fleet.find().sort({ truckId: 1 });
    } else {
      trucks = memoryStore.fleet;
    }

    const inTransit = trucks.filter(t => t.status === 'In Transit').length;
    const idle = trucks.filter(t => t.status === 'Idle').length;
    const maintenance = trucks.filter(t => t.status === 'Maintenance').length;

    const formattedTrucks = trucks.map(t => ({
      _id: t._id,
      id: t.truckId,
      truckId: t.truckId,
      plate: t.plate,
      barangay: t.barangay,
      driver: t.driver,
      status: t.status,
      position: t.position || { top: '35%', left: '50%' }
    }));

    res.json({
      success: true,
      stats: {
        inTransit,
        idle,
        maintenance,
        total: trucks.length
      },
      data: formattedTrucks
    });
  } catch (error) {
    console.error('Fetch Fleet Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/fleet
// @desc    Add a new vehicle and driver
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { id, truckId, plate, barangay, driver, status, position } = req.body;
    const resolvedId = (id || truckId || `TRK-${Math.floor(100 + Math.random() * 900)}`).trim();

    if (!plate || !driver) {
      return res.status(400).json({ success: false, message: 'License plate and driver name are required' });
    }

    const existing = await Fleet.findOne({ truckId: resolvedId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Truck ID "${resolvedId}" already exists.` });
    }

    const created = await Fleet.create({
      truckId: resolvedId,
      plate: plate.trim(),
      barangay: (barangay || 'Carmen').trim(),
      driver: driver.trim(),
      status: status || 'Idle',
      position: position || {
        top: `${Math.floor(25 + Math.random() * 45)}%`,
        left: `${Math.floor(30 + Math.random() * 40)}%`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: {
        _id: created._id,
        id: created.truckId,
        truckId: created.truckId,
        plate: created.plate,
        barangay: created.barangay,
        driver: created.driver,
        status: created.status,
        position: created.position
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/fleet/:id
// @desc    Update vehicle status or assignment
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const { status, driver, barangay, plate, position } = req.body;

    const truck = await Fleet.findOne({
      $or: [{ _id: param }, { truckId: param }]
    });

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (status) truck.status = status;
    if (driver) truck.driver = driver.trim();
    if (barangay) truck.barangay = barangay.trim();
    if (plate) truck.plate = plate.trim();
    if (position) truck.position = position;

    await truck.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: {
        _id: truck._id,
        id: truck.truckId,
        truckId: truck.truckId,
        plate: truck.plate,
        barangay: truck.barangay,
        driver: truck.driver,
        status: truck.status,
        position: truck.position
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/fleet/:id
// @desc    Delete vehicle
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const truck = await Fleet.findOneAndDelete({
      $or: [{ _id: param }, { truckId: param }]
    });

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
