const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Barangay = require('../models/Barangay');
const Report = require('../models/Report');
const memoryStore = require('../config/memoryStore');

// @route   GET /api/barangays
// @desc    Get all barangays with live incident metrics calculated from reports
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const barangays = await Barangay.find().sort({ name: 1 });

      const results = await Promise.all(
        barangays.map(async (bg) => {
          const bgRegex = new RegExp(`^${bg.name}$`, 'i');

          const activeCount = await Report.countDocuments({
            barangay: bgRegex,
            status: { $in: ['Pending', 'Assigned', 'In Progress', 'PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
          });

          const resolvedCount = await Report.countDocuments({
            barangay: bgRegex,
            status: { $in: ['Resolved', 'RESOLVED'] }
          });

          const totalCount = await Report.countDocuments({
            barangay: bgRegex
          });

          return {
            id: bg._id,
            _id: bg._id,
            name: bg.name,
            district: bg.district || 'District 1',
            active: activeCount,
            resolved: resolvedCount,
            total: totalCount,
            teams: bg.teams || 2,
            status: bg.status || 'Active'
          };
        })
      );

      return res.json({
        success: true,
        count: results.length,
        data: results
      });
    }

    // Memory store fallback
    const results = memoryStore.barangays.map(bg => {
      const activeCount = memoryStore.reports.filter(r =>
        r.barangay.toLowerCase() === bg.name.toLowerCase() &&
        ['pending', 'assigned', 'in progress'].includes((r.status || '').toLowerCase())
      ).length;

      const resolvedCount = memoryStore.reports.filter(r =>
        r.barangay.toLowerCase() === bg.name.toLowerCase() &&
        (r.status || '').toLowerCase() === 'resolved'
      ).length;

      const totalCount = memoryStore.reports.filter(r =>
        r.barangay.toLowerCase() === bg.name.toLowerCase()
      ).length;

      return {
        id: bg._id,
        _id: bg._id,
        name: bg.name,
        district: bg.district,
        active: activeCount,
        resolved: resolvedCount,
        total: totalCount,
        teams: bg.teams,
        status: bg.status
      };
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Fetch Barangays Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/barangays
// @desc    Add a new barangay
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, district, teams, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Barangay name is required' });
    }

    const cleanName = name.trim();
    const existing = await Barangay.findOne({ name: new RegExp(`^${cleanName}$`, 'i') });

    if (existing) {
      return res.status(409).json({ success: false, message: `Barangay "${cleanName}" already exists.` });
    }

    const created = await Barangay.create({
      name: cleanName,
      district: district || 'District 1',
      teams: Number(teams) || 2,
      status: status || 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Barangay added successfully',
      data: {
        id: created._id,
        _id: created._id,
        name: created.name,
        district: created.district,
        active: 0,
        resolved: 0,
        total: 0,
        teams: created.teams,
        status: created.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/barangays/:id
// @desc    Update barangay
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { name, district, teams, status } = req.body;
    const bg = await Barangay.findById(req.params.id);

    if (!bg) {
      return res.status(404).json({ success: false, message: 'Barangay not found' });
    }

    if (name) bg.name = name.trim();
    if (district) bg.district = district;
    if (teams !== undefined) bg.teams = teams;
    if (status) bg.status = status;

    await bg.save();

    res.json({
      success: true,
      message: 'Barangay updated successfully',
      data: bg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/barangays/:id
// @desc    Delete barangay
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const bg = await Barangay.findByIdAndDelete(req.params.id);
    if (!bg) {
      return res.status(404).json({ success: false, message: 'Barangay not found' });
    }
    res.json({ success: true, message: 'Barangay deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
