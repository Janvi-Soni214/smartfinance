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
  // Tracks the exact moment the user set their baseline, or the last time we synced emails
  lastEmailSync: { 
    type: Date, 
    default: null 
  }
});

module.exports = mongoose.model('User', UserSchema);