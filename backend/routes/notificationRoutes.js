const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Notification = require('../models/Notification');
const { apiLimiter, sanitizeMongoDB, validateInput } = require('../middleware/securityMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get notification history
// @access  Public
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/notifications
// @desc    Trigger push alert / create notification
// @access  Public
router.post('/', 
  apiLimiter,
  sanitizeMongoDB,
  validateInput([
    body('title').notEmpty().isString().trim().escape().withMessage('Title is required'),
    body('body').notEmpty().isString().trim().escape().withMessage('Body is required'),
    body('type').optional().isString().trim().escape(),
    body('user').optional().isString().trim().escape()
  ]),
  protect,
  adminOnly,
  async (req, res) => {
  try {
    const { title, body, type, user } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const created = await Notification.create({
      title,
      body,
      type: type || 'GENERAL',
      time: 'Just now',
      user: user || null
    });

    res.status(201).json({
      success: true,
      message: 'Notification alert created',
      data: created
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Public
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notif.isRead = true;
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
