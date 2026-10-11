const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  barangay: {
    type: String,
    default: 'Carmen'
  },
  purokZone: {
    type: String,
    default: 'Zone 3'
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  securityPin: {
    type: String,
    default: '1234'
  },
  notificationPreferences: {
    newReports: { type: Boolean, default: true },
    dispatch: { type: Boolean, default: true },
    resolution: { type: Boolean, default: true }
  },
  systemPreferences: {
    dashboardView: {
      type: String,
      enum: ['Executive Dashboard', 'Incident Queue', 'Fleet Overview'],
      default: 'Executive Dashboard'
    },
    ticketStatus: {
      type: String,
      enum: ['All Statuses', 'PENDING', 'ASSIGNED', 'RESOLVED'],
      default: 'All Statuses'
    },
    reportPeriod: {
      type: String,
      enum: ['Current Month', 'Last Month', 'Current Quarter', 'Current Year'],
      default: 'Current Month'
    },
    autoRefresh: { type: Boolean, default: true }
  },
  role: {
    type: String,
    default: 'resident'
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  ecoPoints: {
    type: Number,
    default: 85
  }
}, {
  timestamps: true
});

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Match PIN
userSchema.methods.matchPin = function (enteredPin) {
  if (!this.securityPin) return true;
  return this.securityPin.trim() === enteredPin.toString().trim();
};

module.exports = mongoose.model('User', userSchema);
