const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
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
  assignedAt: {
    type: Date,
    default: null
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
  userEmail: {
    type: String,
    default: ''
  },
  photoUrl: {
    type: String,
    default: '',
    maxlength: 2048
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

reportSchema.pre('validate', function(next) {
  if (!this.reportId) {
    this.reportId = `#CDO-${new Date(this.createdAt || Date.now()).getFullYear()}-${this._id.toString().toUpperCase()}`;
  }
  next();
});

reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ barangay: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
