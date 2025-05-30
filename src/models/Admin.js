const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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