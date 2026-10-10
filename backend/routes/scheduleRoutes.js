const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const memoryStore = require('../config/memoryStore');

// @route   GET /api/schedules
// @desc    Get waste collection schedules
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { barangay } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (barangay && barangay.trim()) {
        query.barangay = new RegExp(barangay.trim(), 'i');
      }
      const schedules = await Schedule.find(query).sort({ barangay: 1 });
      return res.json({
        success: true,
        count: schedules.length,
        data: schedules
      });
    }

    let list = memoryStore.schedules || [];
    if (barangay && barangay.trim()) {
      list = list.filter(s => (s.barangay || '').toLowerCase().includes(barangay.trim().toLowerCase()));
    }

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/schedules
// @desc    Create a new waste collection schedule
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { barangay, biodegradableDays, nonBiodegradableDays, timeSlot, assignedTruck } = req.body;

    if (!barangay) {
      return res.status(400).json({ success: false, message: 'Barangay name is required' });
    }

    const existing = await Schedule.findOne({ barangay: new RegExp(`^${barangay.trim()}$`, 'i') });
    if (existing) {
      return res.status(409).json({ success: false, message: `Schedule for ${barangay} already exists.` });
    }

    const created = await Schedule.create({
      barangay: barangay.trim(),
      biodegradableDays: biodegradableDays || 'Monday, Wednesday, Friday',
      nonBiodegradableDays: nonBiodegradableDays || 'Tuesday, Thursday, Saturday',
      timeSlot: timeSlot || '06:00 AM - 10:00 AM',
      assignedTruck: assignedTruck || 'CLENRO Truck #1'
    });

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: created
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update an existing collection schedule
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { biodegradableDays, nonBiodegradableDays, timeSlot, assignedTruck } = req.body;
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    if (biodegradableDays) schedule.biodegradableDays = biodegradableDays;
    if (nonBiodegradableDays) schedule.nonBiodegradableDays = nonBiodegradableDays;
    if (timeSlot) schedule.timeSlot = timeSlot;
    if (assignedTruck) schedule.assignedTruck = assignedTruck;

    await schedule.save();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete a schedule
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
