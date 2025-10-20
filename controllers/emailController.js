const emailService = require('../services/emailService');
const Transaction = require('../models/Transaction');

const emailController = {
  async sendTransactionEmail(req, res) {
    try {
      let { transactionId, category, recipientEmail, emailSubject} = req.body;

      recipientEmail = recipientEmail?.trim();

      // Validate required fields
      if (!transactionId || !category || !recipientEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: transactionId, category, recipientEmail'
        });
      }

      // Validate category
      const validCategories = ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category. Must be one of: IOTrix, ApiAvengers, StealthFlags, AIFication'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Find the transaction
      const transaction = await Transaction.findOne({ transactionId, category });
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: `Transaction not found for ID: ${transactionId} in category: ${category}`
        });
      }

      // Send email using category-specific template
      const result = await emailService.sendTransactionEmail(
        transaction,
        recipientEmail,
        emailSubject
      );

      res.json({
        success: true,
        message: 'Email sent successfully',
        category: transaction.category,
        collection: result.collection,
        ...result
      });
    } catch (error) {
      console.error('Error sending transaction email:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async sendBulkEmails(req, res) {
    try {
      const { emails } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Emails array is required and cannot be empty'
        });
      }

      // Validate all emails first
      for (const emailData of emails) {
        let { transactionId, category, recipientEmail } = emailData;
        
        recipientEmail = recipientEmail?.trim();
        
        if (!transactionId || !category || !recipientEmail) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields in one or more email entries'
          });
        }

        const validCategories = ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            error: `Invalid category in email data: ${category}`
          });
        }
      }

      const results = [];
      const errors = [];

      for (const emailData of emails) {
        try {
          let { transactionId, category, recipientEmail, emailSubject} = emailData;
          
          recipientEmail = recipientEmail?.trim();
          
          const transaction = await Transaction.findOne({ transactionId, category });
          if (!transaction) {
            errors.push({
              transactionId,
              category,
              recipientEmail,
              error: 'Transaction not found'
            });
            continue;
          }

          const result = await emailService.sendTransactionEmail(
            transaction,
            recipientEmail,
            emailSubject
          );

          results.push({
            transactionId,
            category,
            recipientEmail,
            success: true,
            messageId: result.messageId,
            collection: result.collection
          });
        } catch (error) {
          errors.push({
            transactionId: emailData.transactionId,
            category: emailData.category,
            recipientEmail: emailData.recipientEmail,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        sent: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      res.status(500).json({
        success: false,
        error: 'Bulk email sending failed: ' + error.message
      });
    }
  },

  async getEmailHistory(req, res) {
    try {
      const { transactionId, category } = req.query;
      
      const records = await emailService.getEmailHistory(transactionId, category);
      
      res.json({
        success: true,
        data: records,
        count: records.length,
        categories: ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication']
      });
    } catch (error) {
      console.error('Error fetching email history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email history: ' + error.message
      });
    }
  },

  async getEmailStats(req, res) {
    try {
      const stats = await emailService.getEmailStats();
      
      res.json({
        success: true,
        data: stats,
        categories: ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication']
      });
    } catch (error) {
      console.error('Error fetching email stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email stats: ' + error.message
      });
    }
  }
};

module.exports = emailController;