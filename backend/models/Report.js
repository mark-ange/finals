const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    default: () => `#CDO-2026-${Math.floor(1000 + Math.random() * 9000)}`
  },
  title: {
    type: String,
    required: [true, 'Report title / location description is required']
  },
  category: {
    type: String,
    default: 'Waste Collection'
  },
  barangay: {
    type: String,
    required: true,
    default: 'Carmen'
  },
  district: {
    type: String,
    default: 'District 1'
  },
  purokZone: {
    type: String,
    default: 'Purok 1'
  },
  landmark: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    default: 'Pending'
  },
  description: {
    type: String,
    default: ''
  },
  gpsCoordinates: {
    type: String,
    default: '8.4822° N, 124.6175° E'
  },
  unitAssigned: {
    type: String,
    default: 'Unassigned'
  },
  team: {
    type: String,
    default: ''
  },
  personnel: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  reporter: {
    type: String,
    default: 'Resident Reporter'
  },
  photoUrl: {
    type: String,
    default: ''
  },
  media: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
