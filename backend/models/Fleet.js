const mongoose = require('mongoose');

const fleetSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  plate: {
    type: String,
    required: true,
    trim: true
  },
  barangay: {
    type: String,
    default: 'Carmen'
  },
  driver: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['In Transit', 'Idle', 'Maintenance'],
    default: 'Idle'
  },
  position: {
    top: { type: String, default: '35%' },
    left: { type: String, default: '50%' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fleet', fleetSchema);
