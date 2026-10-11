const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const memoryStore = require('../config/memoryStore');
const {
  apiLimiter,
  reportSubmissionLimiter,
  sanitizeMongoDB,
  validateInput
} = require('../middleware/securityMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const REPORT_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const DEFAULT_REPORT_PAGE_SIZE = 1000;
const MAX_REPORT_PAGE_SIZE = 1000;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeStatus = (status) => {
  const normalized = String(status || 'PENDING').toUpperCase().replace(/[\s-]+/g, '_');
  return REPORT_STATUSES.includes(normalized) ? normalized : 'PENDING';
};

const normalizeStatusCounts = (counts) => {
  const result = Object.fromEntries(REPORT_STATUSES.map(status => [status, 0]));
  counts.forEach(({ _id, count }) => {
    const status = normalizeStatus(_id);
    result[status] += count;
  });
  return result;
};

// Helper to format report object for Vue frontend and Android client
const formatReport = (report) => {
  const doc = report.toObject ? report.toObject() : report;
  const created = new Date(doc.createdAt || Date.now());

  const dateStr = created.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const timeStr = created.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    _id: doc._id,
    id: doc.reportId || `#CDO-2026-${String(doc._id).slice(-4)}`,
    reportId: doc.reportId || `#CDO-2026-${String(doc._id).slice(-4)}`,
    title: doc.title,
    date: dateStr,
    time: timeStr,
    location: doc.title || `Brgy. ${doc.barangay}, ${doc.purokZone || 'Zone 1'}`,
    district: doc.district || 'District 1',
    barangay: doc.barangay,
    purok: doc.purokZone || 'Purok 1',
    purokZone: doc.purokZone || 'Purok 1',
    gps: doc.gpsCoordinates || '8.4822° N, 124.6175° E',
    gpsCoordinates: doc.gpsCoordinates || '8.4822° N, 124.6175° E',
    landmark: doc.landmark || '',
    category: doc.category || 'Waste Collection',
    media: Boolean(doc.photoUrl || doc.media),
    photoUrl: doc.photoUrl || '',
    imageUrl: doc.photoUrl || '',
    status: (doc.status || 'PENDING').toUpperCase(),
    reporter: doc.reporter || 'Civic Resident',
    userEmail: doc.userEmail || '',
    description: doc.description || '',
    team: doc.team || '',
    personnel: doc.personnel || '',
    unitAssigned: doc.unitAssigned || doc.team || 'Unassigned',
    notes: doc.notes || '',
    createdAt: doc.createdAt
  };
};


// @route   GET /api/reports
// @desc    Get all incident waste reports with filtering and search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const district = typeof req.query.district === 'string' ? req.query.district.trim() : '';
    const barangay = typeof req.query.barangay === 'string' ? req.query.barangay.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_REPORT_PAGE_SIZE,
      Math.max(1, Number.parseInt(req.query.limit, 10) || DEFAULT_REPORT_PAGE_SIZE)
    );

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (barangay) query.barangay = new RegExp(escapeRegex(barangay), 'i');
      if (district) query.district = new RegExp(`^${escapeRegex(district)}$`, 'i');
      if (category) query.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
      if (status) {
        const normalizedStatus = normalizeStatus(status);
        query.status = normalizedStatus === 'IN_PROGRESS'
          ? /^in[\s_-]?progress$/i
          : new RegExp(`^${escapeRegex(normalizedStatus)}$`, 'i');
      }

      if (search) {
        const term = new RegExp(escapeRegex(search), 'i');
        query.$or = [
          { reportId: term },
          { title: term },
          { description: term },
          { barangay: term },
          { landmark: term },
          { reporter: term },
          { userEmail: term },
          { category: term },
          { gpsCoordinates: term },
          { unitAssigned: term }
        ];
      }

      const [reports, total, statusGroups, filteredStatusGroups, categories] = await Promise.all([
        Report.find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Report.countDocuments(query),
        Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Report.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Report.distinct('category')
      ]);
      const formatted = reports.map(formatReport);
      return res.json({
        success: true,
        count: formatted.length,
        total,
        filteredTotal: total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        statusCounts: normalizeStatusCounts(statusGroups),
        filteredStatusCounts: normalizeStatusCounts(filteredStatusGroups),
        categories: categories.filter(Boolean).sort(),
        data: formatted
      });
    }

    // Fallback if MongoDB is offline
    let list = memoryStore.reports;
    if (barangay) {
      list = list.filter(r => (r.barangay || '').toLowerCase() === barangay.toLowerCase());
    }
    if (district) {
      list = list.filter(r => (r.district || '').toLowerCase() === district.toLowerCase());
    }
    if (category) {
      list = list.filter(r => (r.category || '').toLowerCase() === category.toLowerCase());
    }
    if (status) {
      list = list.filter(r => normalizeStatus(r.status) === normalizeStatus(status));
    }
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(r =>
        (r.reportId || '').toLowerCase().includes(term) ||
        (r.title || '').toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.barangay || '').toLowerCase().includes(term) ||
        (r.userEmail || '').toLowerCase().includes(term) ||
        (r.reporter || '').toLowerCase().includes(term)
      );
    }

    const start = (page - 1) * limit;
    const formatted = list
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(start, start + limit)
      .map(formatReport);
    const statusCounts = list.reduce((counts, report) => {
      const normalizedStatus = normalizeStatus(report.status);
      counts[normalizedStatus] += 1;
      return counts;
    }, Object.fromEntries(REPORT_STATUSES.map(value => [value, 0])));
    res.json({
      success: true,
      count: formatted.length,
      total: list.length,
      filteredTotal: list.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(list.length / limit)),
      statusCounts,
      filteredStatusCounts: statusCounts,
      categories: [...new Set(memoryStore.reports.map(report => report.category).filter(Boolean))].sort(),
      data: formatted
    });
  } catch (error) {
    console.error('Fetch Reports Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;

    if (mongoose.connection.readyState === 1) {
      const report = await Report.findOne({
        $or: [{ _id: param }, { reportId: param }]
      });
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
      return res.json({ success: true, data: formatReport(report) });
    }

    const report = memoryStore.reports.find(r => r.reportId === param || r._id === param);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: formatReport(report) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reports
// @desc    Create a new incident report (Mobile App & Web Portal)
// @access  Public
router.post('/',
  reportSubmissionLimiter,
  sanitizeMongoDB,
  validateInput([
    body('title').optional().isString().trim().escape(),
    body('category').optional().isString().trim().escape(),
    body('barangay').optional().isString().trim().escape(),
    body('district').optional().isString().trim().escape(),
    body('purokZone').optional().isString().trim().escape(),
    body('landmark').optional().isString().trim().escape(),
    body('description').optional().isString().trim().escape(),
    body('gpsCoordinates').optional().isString().trim(),
    body('photoUrl').optional().isString().trim().isLength({ max: 2048 }).matches(/^https?:\/\/\S+$/i),
    body('imageUrl').optional().isString().trim().isLength({ max: 2048 }).matches(/^https?:\/\/\S+$/i),
    body('photoEvidenceUrl').optional().isString().trim().isLength({ max: 2048 }).matches(/^https?:\/\/\S+$/i),
    body('media').optional().isBoolean().toBoolean(),
    body('reporter').optional().isString().trim().escape(),
    body('userEmail').optional().isEmail().normalizeEmail(),
    body('email').optional().isEmail().normalizeEmail()
  ]),
  async (req, res) => {
  try {
    const {
      title, category, barangay, district, purokZone,
      landmark, description, gpsCoordinates, photoUrl, imageUrl,
      photoEvidenceUrl, media, reporter, userEmail, email
    } = req.body;

    const evidenceUrl = photoUrl || imageUrl || photoEvidenceUrl || '';

    const reportData = {
      title: title || `Brgy. ${barangay || 'Carmen'}, ${purokZone || 'Zone 1'}`,
      category: category || 'Waste Collection',
      barangay: barangay || 'Carmen',
      district: district || 'District 1',
      purokZone: purokZone || 'Purok 1',
      landmark: landmark || '',
      status: 'Pending',
      description: description || 'Civic issue reported by resident.',
      gpsCoordinates: gpsCoordinates || '8.4822° N, 124.6175° E',
      unitAssigned: 'Unassigned',
      team: '',
      personnel: '',
      notes: '',
      photoUrl: evidenceUrl,
      media: Boolean(evidenceUrl || media),
      reporter: reporter || 'Resident Reporter',
      userEmail: userEmail || email || '',
      createdAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const newReport = await Report.create({
        ...reportData,
        user: req.user ? req.user._id : null
      });
      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully to CLENRO',
        data: formatReport(newReport)
      });
    }

    const memDoc = { _id: `rep_${Date.now()}`, ...reportData };
    memoryStore.reports.unshift(memDoc);
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully to CLENRO',
      data: formatReport(memDoc)
    });
  } catch (error) {
    console.error('Create Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/reports/:id/dispatch
// @desc    Dispatch team and personnel to an incident report
// @access  Public
router.put('/:id/dispatch',
  apiLimiter,
  sanitizeMongoDB,
  validateInput([
    body('team').optional().isString().trim().escape(),
    body('personnel').optional().isString().trim().escape(),
    body('notes').optional().isString().trim().escape(),
    body('status').optional().isIn(['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
  ]),
  protect,
  adminOnly,
  async (req, res) => {
  try {
    const param = req.params.id;
    const { team, personnel, notes, status } = req.body;

    if (mongoose.connection.readyState === 1) {
      const report = await Report.findOne({
        $or: [{ _id: param }, { reportId: param }]
      });

      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      if (team !== undefined) report.team = team;
      if (personnel !== undefined) report.personnel = personnel;
      if (notes !== undefined) report.notes = notes;
      if (team) report.unitAssigned = team;
      report.status = status || 'Assigned';
      if (!report.assignedAt && ['assigned', 'in progress'].includes(report.status.toLowerCase().replace(/_/g, ' '))) {
        report.assignedAt = new Date();
      }

      await report.save();

      return res.json({
        success: true,
        message: 'Dispatch assignment saved successfully',
        data: formatReport(report)
      });
    }

    const report = memoryStore.reports.find(r => r.reportId === param || r._id === param);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (team !== undefined) report.team = team;
    if (personnel !== undefined) report.personnel = personnel;
    if (notes !== undefined) report.notes = notes;
    if (team) report.unitAssigned = team;
    report.status = status || 'Assigned';
    if (!report.assignedAt && ['assigned', 'in progress'].includes(report.status.toLowerCase().replace(/_/g, ' '))) {
      report.assignedAt = new Date();
    }

    res.json({
      success: true,
      message: 'Dispatch assignment saved successfully',
      data: formatReport(report)
    });
  } catch (error) {
    console.error('Dispatch Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/reports/:id/status
// @desc    Update report status and assignment
// @access  Public
router.put('/:id/status',
  apiLimiter,
  sanitizeMongoDB,
  validateInput([
    body('status').optional().isIn(['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
    body('unitAssigned').optional().isString().trim().escape(),
    body('team').optional().isString().trim().escape(),
    body('personnel').optional().isString().trim().escape(),
    body('notes').optional().isString().trim().escape()
  ]),
  protect,
  adminOnly,
  async (req, res) => {
  try {
    const rawParam = req.params.id;
    const decodedParam = decodeURIComponent(rawParam);
    const queryIds = Array.from(new Set([
      rawParam,
      decodedParam,
      `#${rawParam.replace(/^#/, '')}`,
      `#${decodedParam.replace(/^#/, '')}`,
      rawParam.replace(/^#/, ''),
      decodedParam.replace(/^#/, '')
    ]));

    const { status, unitAssigned, team, personnel, notes } = req.body;

    if (mongoose.connection.readyState === 1) {
      const orClauses = queryIds.map(qid => ({ reportId: qid }));
      if (mongoose.isValidObjectId(rawParam)) orClauses.push({ _id: rawParam });

      const report = await Report.findOne({ $or: orClauses });

      if (!report) {
        return res.status(404).json({ success: false, message: `Report "${rawParam}" not found` });
      }

      if (status) report.status = status;
      if (!report.assignedAt && status && ['assigned', 'in progress'].includes(status.toLowerCase().replace(/_/g, ' '))) {
        report.assignedAt = new Date();
      }
      if (unitAssigned) report.unitAssigned = unitAssigned;
      if (team) report.team = team;
      if (personnel) report.personnel = personnel;
      if (notes) report.notes = notes;

      await report.save();

      return res.json({
        success: true,
        message: 'Report status updated',
        data: formatReport(report)
      });
    }

    const report = memoryStore.reports.find(r =>
      queryIds.includes(r.reportId) || queryIds.includes(r._id)
    );
    if (!report) return res.status(404).json({ success: false, message: `Report "${rawParam}" not found` });

    if (status) report.status = status;
    if (!report.assignedAt && status && ['assigned', 'in progress'].includes(status.toLowerCase().replace(/_/g, ' '))) {
      report.assignedAt = new Date();
    }
    if (unitAssigned) report.unitAssigned = unitAssigned;
    if (team) report.team = team;
    if (personnel) report.personnel = personnel;
    if (notes) report.notes = notes;


    res.json({
      success: true,
      message: 'Report status updated',
      data: formatReport(report)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete or reject a report
// @access  Public
router.delete('/:id',
  apiLimiter,
  sanitizeMongoDB,
  protect,
  adminOnly,
  async (req, res) => {
  try {
    const param = req.params.id;

    if (mongoose.connection.readyState === 1) {
      const report = await Report.findOneAndDelete({
        $or: [{ _id: param }, { reportId: param }]
      });

      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      return res.json({ success: true, message: 'Report deleted successfully' });
    }

    const idx = memoryStore.reports.findIndex(r => r.reportId === param || r._id === param);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Report not found' });
    memoryStore.reports.splice(idx, 1);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
