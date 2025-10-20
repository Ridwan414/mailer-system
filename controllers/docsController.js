const googleSheetsService = require('../services/googleSheetsService');
const duplicateService = require('../services/duplicateService');
const Transaction = require('../models/Transaction');

const docsController = {
  async getAllData(req, res) {
    try {
      const { refresh = 'false' } = req.query;
      
      if (refresh === 'true') {
        await googleSheetsService.refreshTransactions(Transaction, 'all');
      }

      const transactions = await Transaction.find({});
      const transactionsWithDuplicates = await duplicateService.highlightDuplicates(transactions);
      
      // Group by category
      const categorizedData = {};
      const categories = ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication'];
      
      categories.forEach(category => {
        categorizedData[category] = transactionsWithDuplicates
          .filter(t => t.category === category)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      // Calculate summary statistics
      const summary = {
        totalTransactions: transactions.length,
        totalDuplicates: transactions.filter(t => t.isDuplicate).length,
        categoryCounts: {}
      };

      categories.forEach(category => {
        summary.categoryCounts[category] = categorizedData[category].length;
      });

      res.json({
        success: true,
        data: categorizedData,
        summary: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching all data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data from Google Sheets'
      });
    }
  },

  async getCategoryData(req, res) {
    try {
      const { category } = req.params;
      const { search, refresh = 'false' } = req.query;

      // Validate category
      const validCategories = ['IOTrix', 'ApiAvengers', 'StealthFlags', 'AIFication'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category. Must be one of: IOTrix, ApiAvengers, StealthFlags, AIFication'
        });
      }

      if (refresh === 'true') {
        await googleSheetsService.refreshTransactions(Transaction, category);
      }

      let query = { category };
      
      if (search) {
          query.$or = [
            { transactionId: { $regex: search, $options: 'i' } },
            { teamName: { $regex: search, $options: 'i' } },
            { teamLead: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { institution: { $regex: search, $options: 'i' } }
          ];
      }

      const transactions = await Transaction.find(query).sort({ createdAt: -1 });
      const transactionsWithDuplicates = await duplicateService.highlightDuplicates(transactions);

      res.json({
        success: true,
        data: transactionsWithDuplicates,
        count: transactionsWithDuplicates.length,
        category: category
      });
    } catch (error) {
      console.error(`Error fetching ${req.params.category} data:`, error);
      res.status(500).json({
        success: false,
        error: `Failed to fetch ${req.params.category} data`
      });
    }
  },

  async searchTransactions(req, res) {
    try {
      const { 
        transactionId, 
        category, 
        teamName, 
        teamLead, 
        email, 
        phone,
        institution,
        paymentMethod 
      } = req.query;
      
      let query = {};
      
      // Build query dynamically based on provided parameters
      const searchFields = [
        { field: 'transactionId', value: transactionId },
        { field: 'category', value: category },
        { field: 'teamName', value: teamName },
        { field: 'teamLead', value: teamLead },
        { field: 'email', value: email },
        { field: 'phone', value: phone },
        { field: 'institution', value: institution },
        { field: 'paymentMethod', value: paymentMethod }
      ];

    searchFields.forEach(({ field, value }) => {
      if (value && value.trim() !== '') {
        if (field === 'category') {
          if (value !== 'all') {
            query[field] = value;
          }
        } else {
          query[field] = { $regex: value, $options: 'i' };
        }
      }
    });

      const transactions = await Transaction.find(query).sort({ createdAt: -1 });
      const transactionsWithDuplicates = await duplicateService.highlightDuplicates(transactions);

      res.json({
        success: true,
        data: transactionsWithDuplicates,
        count: transactionsWithDuplicates.length,
        searchParams: req.query
      });
    } catch (error) {
      console.error('Error searching transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed'
      });
    }
  },

  async getDuplicatesReport(req, res) {
    try {
      const report = await duplicateService.getDuplicateReport();
      
      res.json({
        success: true,
        ...report
      });
    } catch (error) {
      console.error('Error getting duplicates report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate duplicates report'
      });
    }
  },

  async refreshData(req, res) {
    try {
      const { category = 'all' } = req.query;
      
      const result = await googleSheetsService.refreshTransactions(Transaction, category);
      
      res.json({
        success: true,
        message: 'Data refreshed successfully',
        ...result
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh data: ' + error.message
      });
    }
  },

  async getStats(req, res) {
    try {
      const totalTransactions = await Transaction.countDocuments();
      const duplicateTransactions = await Transaction.countDocuments({ isDuplicate: true });
      
      const categoryStats = await Transaction.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      const paymentMethodStats = await Transaction.aggregate([
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        stats: {
          totalTransactions,
          duplicateTransactions,
          categories: categoryStats,
          paymentMethods: paymentMethodStats
        }
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  }
};

module.exports = docsController;