const mongoose = require('mongoose');

const emailRecordSchema = new mongoose.Schema({
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
  recipientEmail: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'failed'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
emailRecordSchema.index({ transactionId: 1, category: 1 });
emailRecordSchema.index({ sentAt: -1 });
emailRecordSchema.index({ category: 1, status: 1 });

const EmailRecordIOTrix = mongoose.model('EmailRecordIOTrix', emailRecordSchema, 'email_records_iotrix');
const EmailRecordApiAvengers = mongoose.model('EmailRecordApiAvengers', emailRecordSchema, 'email_records_apiavengers');
const EmailRecordStealthFlags = mongoose.model('EmailRecordStealthFlags', emailRecordSchema, 'email_records_stealthflags');
const EmailRecordAIFication = mongoose.model('EmailRecordAIFication', emailRecordSchema, 'email_records_aification');

const getEmailRecordModel = (category) => {
  switch (category) {
    case 'IOTrix':
      return EmailRecordIOTrix;
    case 'ApiAvengers':
      return EmailRecordApiAvengers;
    case 'StealthFlags':
      return EmailRecordStealthFlags;
    case 'AIFication':
      return EmailRecordAIFication;
    default:
      throw new Error(`Invalid category: ${category}`);
  }
};

module.exports = {
  EmailRecordIOTrix,
  EmailRecordApiAvengers,
  EmailRecordStealthFlags,
  EmailRecordAIFication,
  getEmailRecordModel
};