const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
name: {               
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {            
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  categories: {
    type: [String],
    default: [
      'Living expenses',
      'Transportation expenses',
      'Family care',
      'Personal care',
      'Health care',
      'Technology',
      'Debt payments',
      'Savings and investments',
      'Entertainment',
      'Miscellaneous expenses'
    ]
  },
  // Tracks the exact moment the user set their baseline, or the last time we synced emails
  lastEmailSync: { 
    type: Date, 
    default: null 
  },
  settings: {
    twoFactorEnabled: { type: Boolean, default: false },
    emailAlerts: { type: Boolean, default: true },
    smsParsing: { type: Boolean, default: true }
  },
  profileImage: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('User', UserSchema);