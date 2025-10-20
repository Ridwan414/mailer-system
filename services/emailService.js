const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { getEmailRecordModel } = require('../models/EmailRecord');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templateDir = path.join(__dirname, 'emailTemplates');
    this.initializeTransporter();
  }

  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error('SMTP configuration error:', error);
      } else {
        console.log('SMTP transporter is ready');
      }
    });
  }

  async loadTemplate(category, transaction) {
    try {
      const templatePath = path.join(this.templateDir, `${category.toLowerCase()}.html`);
      
      let templateContent = await fs.readFile(templatePath, 'utf8');
      
      const replacedContent = this.replaceTemplateVariables(templateContent, transaction);
      
      return replacedContent;
    } catch (error) {
      console.warn(`Template for ${category} not found, using default template`);
      throw new Error(`No email templates found: ${error.message}`);
    }
  }

  replaceTemplateVariables(template, transaction) {
    const variables = {
      // Team information
      '{{teamName}}': transaction.teamName || 'N/A',
      '{{teamLead}}': transaction.teamLead || 'N/A',
      '{{transactionId}}': transaction.transactionId || 'N/A',
      
      // Contact information
      '{{email}}': transaction.email || 'N/A',
      '{{phone}}': transaction.phone || 'N/A',
      '{{institution}}': transaction.institution || 'N/A',
      
      // Payment information
      '{{paymentMethod}}': transaction.paymentMethod || 'N/A',
      '{{paymentNumber}}': transaction.paymentNumber || 'N/A',
      '{{timestamp}}': transaction.timestamp || 'N/A',
      
      // Current year for copyrights
      '{{currentYear}}': new Date().getFullYear()
    };

    let replacedTemplate = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(key, 'g');
      replacedTemplate = replacedTemplate.replace(regex, variables[key]);
    });
    
    return replacedTemplate;
  }

  generateEmailSubject(category, transaction) {
    const subjects = {
      'AIFication': `Registration Confirmed: AI-FICATION 2025 - Your Journey Begins Now - ${transaction.teamName}`,
      'IOTrix': `You're Officially Registered for IOTrix 2025 - ${transaction.teamName}`,
      'StealthFlags': `You're Officially Registered for StealthFlags 2025! - ${transaction.teamName}`,
      'ApiAvengers': `✅ Your Team is Registered for API Avengers, a Microservice Hackathon 2025! - ${transaction.teamName}`
    };
    
    return subjects[category];
  }

  // Generate plain text version from HTML
  generatePlainText(htmlContent) {
    return htmlContent
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  async sendTransactionEmail(transaction, recipientEmail, emailSubject) {
    try {
      const htmlContent = await this.loadTemplate(transaction.category, transaction);
      const textContent = this.generatePlainText(htmlContent);
      const subject = emailSubject || this.generateEmailSubject(transaction.category, transaction);
      
      const mailOptions = {
        from: {
          name: 'Televerse 1.0',
          address: process.env.GMAIL_USER
        },
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
        text: textContent
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      const EmailRecordModel = getEmailRecordModel(transaction.category);
      
      const emailRecord = new EmailRecordModel({
        transactionId: transaction.transactionId,
        category: transaction.category,
        recipientEmail,
        status: 'sent',
        metadata: {
          messageId: result.messageId,
          templateType: transaction.category,
          category: transaction.category
        }
      });

      await emailRecord.save();

      return {
        success: true,
        messageId: result.messageId,
        emailRecordId: emailRecord._id,
        collection: EmailRecordModel.collection.name
      };

    } catch (error) {
      console.error('Error sending email:', error);
      
      try {
        const EmailRecordModel = getEmailRecordModel(transaction.category);
        const emailRecord = new EmailRecordModel({
          transactionId: transaction.transactionId,
          category: transaction.category,
          recipientEmail,
          status: 'failed',
          metadata: {
            error: error.message,
            templateType: transaction.category,
            category: transaction.category
          }
        });
        await emailRecord.save();
      } catch (dbError) {
        console.error('Error saving failed email record:', dbError);
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async getEmailHistory(transactionId, category) {
    try {
      if (category && category != "all") {
        const EmailRecordModel = getEmailRecordModel(category);
        const query = {};
        if (transactionId) query.transactionId = transactionId;
        
        const records = await EmailRecordModel.find(query)
          .sort({ sentAt: -1 })
          .limit(50);

        return records;
      } else {
        const categories = ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication'];
        let allRecords = [];
        
        for (const cat of categories) {
          const EmailRecordModel = getEmailRecordModel(cat);
          const query = {};
          if (transactionId) query.transactionId = transactionId;
          
          const records = await EmailRecordModel.find(query)
            .sort({ sentAt: -1 })
            .limit(50);
          
          allRecords = allRecords.concat(records);
        }
        
        allRecords.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        
        return allRecords.slice(0, 50);
      }
    } catch (error) {
      console.error('Error fetching email history:', error);
      throw error;
    }
  }

  async getEmailStats() {
    try {
      const categories = ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication'];
      const stats = {};
      
      for (const category of categories) {
        const EmailRecordModel = getEmailRecordModel(category);
        
        const total = await EmailRecordModel.countDocuments();
        const sent = await EmailRecordModel.countDocuments({ status: 'sent' });
        const failed = await EmailRecordModel.countDocuments({ status: 'failed' });
        
        stats[category] = {
          total,
          sent,
          failed,
          collection: EmailRecordModel.collection.name
        };
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();