const mongoose = require('mongoose');

const barangaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Barangay name is required'],
    unique: true,
    trim: true
  },
  district: {
    type: String,
    default: 'District 1'
  },
  teams: {
    type: Number,
    default: 2
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Barangay', barangaySchema);
