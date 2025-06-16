const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['ADMIN', 'SUPERADMIN'],
    default: 'ADMIN'
  },
  permissions: {
    userManagement: Boolean,
    subscriptionManagement: Boolean,
    categoryManagement: Boolean,
    adminManagement: Boolean,
    settingsManagement: Boolean
  },
  lastLogin: Date,
  activityLog: [{
    action: String,
    timestamp: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);