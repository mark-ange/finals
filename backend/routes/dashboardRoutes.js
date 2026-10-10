const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const Fleet = require('../models/Fleet');
const Barangay = require('../models/Barangay');
const memoryStore = require('../config/memoryStore');

// @route   GET /api/dashboard/stats
// @desc    Get live operational statistics calculated directly from MongoDB
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const totalTickets = await Report.countDocuments();
      const pending = await Report.countDocuments({ status: { $in: ['Pending', 'PENDING'] } });
      const assigned = await Report.countDocuments({ status: { $in: ['Assigned', 'ASSIGNED'] } });
      const inProgress = await Report.countDocuments({ status: { $in: ['In Progress', 'IN_PROGRESS'] } });
      const resolved = await Report.countDocuments({ status: { $in: ['Resolved', 'RESOLVED'] } });

      const liveQueueDocs = await Report.find({
        status: { $in: ['Pending', 'PENDING', 'Assigned', 'ASSIGNED'] }
      })
        .sort({ createdAt: -1 })
        .limit(6);

      const liveQueue = liveQueueDocs.map(doc => ({
        _id: doc._id,
        id: doc.reportId,
        status: doc.status.toUpperCase(),
        title: doc.category || doc.title,
        location: doc.title || `Brgy. ${doc.barangay}, ${doc.purokZone || 'Zone 1'}`,
        barangay: doc.barangay,
        time: new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      const barangayAgg = await Report.aggregate([
        {
          $group: {
            _id: '$barangay',
            count: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $in: ['$status', ['Pending', 'PENDING']] }, 1, 0]
              }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]);

      const barangayStats = barangayAgg.map(item => ({
        barangay: item._id || 'Unknown',
        incidents: item.count,
        pending: item.pending
      }));

      const fleetTrucks = await Fleet.find();
      const inTransit = fleetTrucks.filter(t => t.status === 'In Transit').length;
      const idle = fleetTrucks.filter(t => t.status === 'Idle').length;
      const maintenance = fleetTrucks.filter(t => t.status === 'Maintenance').length;

      return res.json({
        success: true,
        data: {
          totalTickets,
          pending,
          assigned,
          inProgress,
          resolved,
          resolutionRate: totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0,
          liveQueue,
          barangayStats,
          fleet: { total: fleetTrucks.length, inTransit, idle, maintenance }
        }
      });
    }

    // Memory Store Fallback
    const reports = memoryStore.reports;
    const totalTickets = reports.length;
    const pending = reports.filter(r => ['pending'].includes((r.status || '').toLowerCase())).length;
    const assigned = reports.filter(r => ['assigned'].includes((r.status || '').toLowerCase())).length;
    const inProgress = reports.filter(r => ['in progress'].includes((r.status || '').toLowerCase())).length;
    const resolved = reports.filter(r => ['resolved'].includes((r.status || '').toLowerCase())).length;

    const liveQueue = reports
      .filter(r => ['pending', 'assigned'].includes((r.status || '').toLowerCase()))
      .slice(0, 6)
      .map(r => ({
        _id: r._id,
        id: r.reportId,
        status: (r.status || 'PENDING').toUpperCase(),
        title: r.category || r.title,
        location: r.title || `Brgy. ${r.barangay}`,
        barangay: r.barangay,
        time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

    const bgMap = {};
    reports.forEach(r => {
      const bg = r.barangay || 'Carmen';
      if (!bgMap[bg]) bgMap[bg] = { count: 0, pending: 0 };
      bgMap[bg].count++;
      if ((r.status || '').toLowerCase() === 'pending') bgMap[bg].pending++;
    });

    const barangayStats = Object.keys(bgMap).map(bg => ({
      barangay: bg,
      incidents: bgMap[bg].count,
      pending: bgMap[bg].pending
    }));

    const fleet = memoryStore.fleet;
    const inTransit = fleet.filter(t => t.status === 'In Transit').length;
    const idle = fleet.filter(t => t.status === 'Idle').length;
    const maintenance = fleet.filter(t => t.status === 'Maintenance').length;

    res.json({
      success: true,
      data: {
        totalTickets,
        pending,
        assigned,
        inProgress,
        resolved,
        resolutionRate: totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0,
        liveQueue,
        barangayStats,
        fleet: { total: fleet.length, inTransit, idle, maintenance }
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
