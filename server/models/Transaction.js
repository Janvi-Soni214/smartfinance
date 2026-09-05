const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {                                         
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Completed' },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  source: { 
    type: String, 
    enum: ['GMAIL', 'MANUAL'], 
    default: 'MANUAL' 
  },
  isDuplicate: { 
    type: Boolean, 
    default: false 
  },
  enrichedData: {
    orderId: String,
    secondarySource: String
  },
  gmailMessageId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  // 🔥 NEW: Global Deduplication Hash for all banks
  financialRefHash: {
    type: String,
    unique: true, 
    sparse: true  
  },
  rawPayloadId: String 
});

module.exports = mongoose.model('Transaction', TransactionSchema);