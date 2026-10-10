const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const memoryStore = require('../config/memoryStore');

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
    status: (doc.status || 'PENDING').toUpperCase(),
    reporter: doc.reporter || 'Civic Resident',
    userEmail: doc.userEmail || (doc.reporter ? `${doc.reporter.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.com` : 'resident@gmail.com'),
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
    const { search, district, barangay, category, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (barangay && barangay.trim()) query.barangay = new RegExp(barangay.trim(), 'i');
      if (district && district.trim()) query.district = district.trim();
      if (category && category.trim()) query.category = new RegExp(category.trim(), 'i');
      if (status && status.trim()) query.status = new RegExp(`^${status.trim()}$`, 'i');

      if (search && search.trim()) {
        const term = search.trim();
        query.$or = [
          { reportId: new RegExp(term, 'i') },
          { title: new RegExp(term, 'i') },
          { description: new RegExp(term, 'i') },
          { barangay: new RegExp(term, 'i') },
          { landmark: new RegExp(term, 'i') },
          { reporter: new RegExp(term, 'i') }
        ];
      }

      const reports = await Report.find(query).sort({ createdAt: -1 });
      const formatted = reports.map(formatReport);
      return res.json({ success: true, count: formatted.length, data: formatted });
    }

    // Fallback if MongoDB is offline
    let list = memoryStore.reports;
    if (barangay && barangay.trim()) {
      list = list.filter(r => r.barangay.toLowerCase() === barangay.trim().toLowerCase());
    }
    if (district && district.trim()) {
      list = list.filter(r => (r.district || '').toLowerCase() === district.trim().toLowerCase());
    }
    if (category && category.trim()) {
      list = list.filter(r => (r.category || '').toLowerCase() === category.trim().toLowerCase());
    }
    if (status && status.trim()) {
      list = list.filter(r => (r.status || '').toLowerCase() === status.trim().toLowerCase());
    }
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(r =>
        (r.reportId || '').toLowerCase().includes(term) ||
        (r.title || '').toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.barangay || '').toLowerCase().includes(term) ||
        (r.reporter || '').toLowerCase().includes(term)
      );
    }

    const formatted = list.map(formatReport);
    res.json({ success: true, count: formatted.length, data: formatted });
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
router.post('/', async (req, res) => {
  try {
    const {
      title, category, barangay, district, purokZone,
      landmark, description, gpsCoordinates, photoUrl,
      media, reporter, status
    } = req.body;

    const generatedId = `#CDO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const reportData = {
      reportId: generatedId,
      title: title || `Brgy. ${barangay || 'Carmen'}, ${purokZone || 'Zone 1'}`,
      category: category || 'Waste Collection',
      barangay: barangay || 'Carmen',
      district: district || 'District 1',
      purokZone: purokZone || 'Purok 1',
      landmark: landmark || '',
      status: status || 'Pending',
      description: description || 'Civic issue reported by resident.',
      gpsCoordinates: gpsCoordinates || '8.4822° N, 124.6175° E',
      unitAssigned: 'Unassigned',
      team: '',
      personnel: '',
      notes: '',
      photoUrl: photoUrl || '',
      media: Boolean(photoUrl || media),
      reporter: reporter || 'Resident Reporter',
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
router.put('/:id/dispatch', async (req, res) => {
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
router.put('/:id/status', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
