const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication']
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Common fields across all categories
  teamName: String,
  teamLead: String,
  email: String,
  phone: String,
  institution: String,
  paymentMethod: String,
  paymentNumber: String,
  timestamp: String,
    
  // Duplicate tracking
  isDuplicate: {
    type: Boolean,
    default: false
  },
  duplicateOf: [{
    type: String
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient searching
transactionSchema.index({ transactionId: 1, category: 1 });
transactionSchema.index({ isDuplicate: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ teamName: 1 });
transactionSchema.index({ teamLead: 1 });
transactionSchema.index({ email: 1 });
transactionSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);