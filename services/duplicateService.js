const Transaction = require('../models/Transaction');

class DuplicateService {
  async findDuplicates() {
    try {
      // Find all transactions that have duplicates
      const duplicates = await Transaction.aggregate([
        {
          $group: {
            _id: '$transactionId',
            count: { $sum: 1 },
            transactions: { $push: '$$ROOT' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        },
        {
          $project: {
            transactionId: '$_id',
            count: 1,
            transactions: 1,
            _id: 0
          }
        }
      ]);

      return duplicates;
    } catch (error) {
      console.error('Error finding duplicates:', error);
      throw error;
    }
  }

  async highlightDuplicates(transactions) {
    const duplicateIds = new Set();
    
    // Get all duplicate transaction IDs
    const duplicates = await this.findDuplicates();
    duplicates.forEach(dup => {
      duplicateIds.add(dup.transactionId);
    });

    // Add duplicate flag to each transaction
    return transactions.map(transaction => ({
      ...transaction.toObject ? transaction.toObject() : transaction,
      isDuplicate: duplicateIds.has(transaction.transactionId)
    }));
  }

  async getDuplicateReport() {
    const duplicates = await this.findDuplicates();
    
    const report = {
      totalDuplicates: duplicates.length,
      duplicateGroups: duplicates.map(group => ({
        transactionId: group.transactionId,
        count: group.count,
        categories: [...new Set(group.transactions.map(t => t.category))],
        transactions: group.transactions.map(t => ({
          id: t._id,
          category: t.category,
          sourceDoc: t.sourceDoc
        }))
      }))
    };

    return report;
  }
}

module.exports = new DuplicateService();