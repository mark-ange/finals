const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['REPORT_UPDATE', 'COLLECTION_SCHEDULE', 'DISPATCH', 'GENERAL'],
    default: 'GENERAL'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  time: {
    type: String,
    default: 'Just now'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
