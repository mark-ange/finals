const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const Fleet = require('../models/Fleet');
const Barangay = require('../models/Barangay');
const memoryStore = require('../config/memoryStore');
const { apiLimiter, sanitizeMongoDB } = require('../middleware/securityMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const summarizeReports = (reports) => {
  const barangays = new Map();
  const categories = new Map();
  const responseDays = new Map();
  const assignedDurations = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const firstDay = new Date(today);
  firstDay.setUTCDate(firstDay.getUTCDate() - 6);

  for (const report of reports) {
    const barangay = report.barangay || 'Unknown';
    const category = report.category || 'Uncategorized';
    const status = (report.status || '').toLowerCase().replace(/_/g, ' ');
    const barangayEntry = barangays.get(barangay) || { count: 0, pending: 0 };
    barangayEntry.count += 1;
    if (status === 'pending') barangayEntry.pending += 1;
    barangays.set(barangay, barangayEntry);
    categories.set(category, (categories.get(category) || 0) + 1);

    if (report.assignedAt && report.createdAt) {
      const assignedAt = new Date(report.assignedAt);
      const createdAt = new Date(report.createdAt);
      const durationHours = (assignedAt - createdAt) / (1000 * 60 * 60);
      if (Number.isFinite(durationHours) && durationHours >= 0) {
        assignedDurations.push(durationHours);
        if (assignedAt >= firstDay && assignedAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
          const day = assignedAt.toISOString().slice(0, 10);
          const entry = responseDays.get(day) || { total: 0, count: 0 };
          entry.total += durationHours;
          entry.count += 1;
          responseDays.set(day, entry);
        }
      }
    }
  }

  const total = reports.length;
  const responseTimes = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(firstDay);
    day.setUTCDate(firstDay.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);
    const entry = responseDays.get(key);
    return {
      label: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      value: entry ? Math.round((entry.total / entry.count) * 10) / 10 : null
    };
  });

  return {
    barangayStats: [...barangays.entries()]
      .map(([name, values]) => ({
        name,
        count: values.count,
        pending: values.pending,
        percentage: total ? Math.round((values.count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    categories: [...categories.entries()]
      .map(([name, count]) => ({
        name,
        count,
        percent: total ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count),
    avgResponse: assignedDurations.length
      ? Math.round((assignedDurations.reduce((sum, duration) => sum + duration, 0) / assignedDurations.length) * 10) / 10
      : null,
    responseTimes
  };
};

// @route   GET /api/dashboard/stats
// @desc    Get live operational statistics calculated directly from MongoDB
// @access  Public
router.get('/stats', 
  apiLimiter,
  sanitizeMongoDB,
  protect,
  adminOnly,
  async (req, res) => {
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

      const weekStart = new Date();
      weekStart.setUTCHours(0, 0, 0, 0);
      weekStart.setUTCDate(weekStart.getUTCDate() - 6);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

      const [barangayAgg, categoryAgg, assignedResponseAgg, dailyResponseAgg] = await Promise.all([
        Report.aggregate([
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
        ]),
        Report.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Report.aggregate([
          { $match: { assignedAt: { $ne: null }, createdAt: { $ne: null } } },
          {
            $project: {
              hours: { $divide: [{ $subtract: ['$assignedAt', '$createdAt'] }, 3600000] }
            }
          },
          { $match: { hours: { $gte: 0 } } },
          { $group: { _id: null, average: { $avg: '$hours' } } }
        ]),
        Report.aggregate([
          {
            $match: {
              assignedAt: { $gte: weekStart, $lt: weekEnd },
              createdAt: { $ne: null }
            }
          },
          {
            $project: {
              assignedAt: 1,
              hours: { $divide: [{ $subtract: ['$assignedAt', '$createdAt'] }, 3600000] }
            }
          },
          { $match: { hours: { $gte: 0 } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$assignedAt', timezone: 'UTC' }
              },
              average: { $avg: '$hours' }
            }
          }
        ])
      ]);

      const dailyResponses = new Map(
        dailyResponseAgg.map(item => [item._id, Math.round(item.average * 10) / 10])
      );
      const responseTimes = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setUTCDate(weekStart.getUTCDate() + index);
        return {
          label: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
          value: dailyResponses.get(day.toISOString().slice(0, 10)) ?? null
        };
      });
      const reportSummary = {
        barangayStats: barangayAgg.map(item => ({
          name: item._id || 'Unknown',
          count: item.count,
          pending: item.pending,
          percentage: totalTickets ? Math.round((item.count / totalTickets) * 100) : 0
        })),
        categories: categoryAgg.map(item => ({
          name: item._id || 'Uncategorized',
          count: item.count,
          percent: totalTickets ? Math.round((item.count / totalTickets) * 100) : 0
        })),
        avgResponse: assignedResponseAgg.length
          ? Math.round(assignedResponseAgg[0].average * 10) / 10
          : null,
        responseTimes
      };

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
          ...reportSummary,
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

    const reportSummary = summarizeReports(reports);

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
        ...reportSummary,
        fleet: { total: fleet.length, inTransit, idle, maintenance }
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
