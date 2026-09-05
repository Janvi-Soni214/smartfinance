const mongoose = require('mongoose');

// This collection acts as a permanent "seen" log for Gmail messages.
// Even if a user deletes a transaction, we never delete this record,
// which guarantees the same email is never imported twice.
const ProcessedEmailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  gmailMessageId: {
    type: String,
    required: true,
  },
  financialRefHash: {
    type: String,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: one user can only process any given message ID once
ProcessedEmailSchema.index({ user: 1, gmailMessageId: 1 }, { unique: true });

module.exports = mongoose.model('ProcessedEmail', ProcessedEmailSchema);
