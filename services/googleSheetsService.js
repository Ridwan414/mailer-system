const { sheets } = require('../config/google');

class GoogleSheetsService {
  constructor() {
    this.sheetIds = {
      IOTrix: process.env.SHEET_ID_IOTrix,
      ApiAvengers: process.env.SHEET_ID_ApiAvengers,
      StealthFlags: process.env.SHEET_ID_StealthFlags,
      AIFication: process.env.SHEET_ID_AIFication
    };

    this.validateSheetIds();
  }

  validateSheetIds() {
    for (const [category, sheetId] of Object.entries(this.sheetIds)) {
      if (!sheetId) {
        console.warn(`No sheet ID configured for ${category}`);
      }
    }
  }

  async fetchSheetData(sheetId, range = 'A:AF') {
    try {
      if (!sheetId) {
        throw new Error('Sheet ID is required');
      }

      console.log(`Fetching data from sheet: ${sheetId.substring(0, 10)}..., range: ${range}`);
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });
      
      const rowCount = response.data.values ? response.data.values.length : 0;
      console.log(`Retrieved ${rowCount} rows from sheet`);
      return response.data.values || [];
    } catch (error) {
      console.error(`Error fetching sheet ${sheetId}:`, error.message);
      
      if (error.code === 403) {
        throw new Error('Access denied to Google Sheet. Please check if the service account has been granted access.');
      } else if (error.code === 404) {
        throw new Error('Google Sheet not found. Please check the Sheet ID.');
      }
      
      throw new Error(`Failed to fetch sheet data: ${error.message}`);
    }
  }

  // Parse StealthFlags data structure
  parseStealthFlags(rows, sourceSheet) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const transactions = [];

    console.log(`Parsing StealthFlags data with ${dataRows.length} rows`);

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      const transactionData = {};
      let transactionId = '';

      // Map all headers to values
      headers.forEach((header, index) => {
        const key = this.sanitizeKey(header);
        transactionData[key] = row[index] || '';
        
        if (header.toLowerCase().includes('payment transection id')) {
          transactionId = row[index] || '';
        }
      });

      if (transactionId && transactionId.trim() !== '') {
        transactions.push({
          transactionId: transactionId.trim(),
          category: 'StealthFlags',
          data: transactionData,
          teamName: transactionData['name_of_the_team'] || '',
          teamLead: transactionData['name_team_lead'] || '',
          email: transactionData['email_team_lead'] || '',
          phone: transactionData['contact_number_team_lead'] || '',
          institution: transactionData['institution_name'] || '',
          paymentMethod: transactionData['payment_method'] || '',
          paymentNumber: transactionData['number_used_during_payment'] || '',
          timestamp: transactionData['timestamp'] || ''
        });
      }
    }

    return transactions;
  }

  // Parse AIFication data structure
  parseAIFication(rows, sourceSheet) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const transactions = [];

    console.log(`Parsing AIFication data with ${dataRows.length} rows`);

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      const transactionData = {};
      let transactionId = '';

      headers.forEach((header, index) => {
        const key = this.sanitizeKey(header);
        transactionData[key] = row[index] || '';
        
        if (header.toLowerCase().includes('transaction id')) {
          transactionId = row[index] || '';
        }
      });

      // AIFication specific transaction ID column
      if (!transactionId) {
        const transactionIdIndex = headers.findIndex(h => 
          h.toLowerCase().includes('transaction id')
        );
        if (transactionIdIndex !== -1) {
          transactionId = row[transactionIdIndex] || '';
        }
      }

      if (transactionId && transactionId.trim() !== '') {
        transactions.push({
          transactionId: transactionId.trim(),
          category: 'AIFication',
          data: transactionData,
          teamName: transactionData['team_name'] || '',
          teamLead: transactionData['name_of_the_team_leader'] || '',
          email: transactionData['email_address_team_leader'] || '',
          phone: transactionData['contact_no_team_leader'] || '',
          institution: transactionData['institution_team_leader'] || '',
          paymentMethod: transactionData['select_your_payment_method'] || '',
          paymentNumber: transactionData['number_used_for_payment'] || '',
          timestamp: transactionData['timestamp'] || '',
        });
      }
    }

    return transactions;
  }

  // Parse IOTrix data structure
  parseIOTrix(rows, sourceSheet) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const transactions = [];

    console.log(`Parsing IOTrix data with ${dataRows.length} rows`);

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      const transactionData = {};
      let transactionId = '';

      headers.forEach((header, index) => {
        const key = this.sanitizeKey(header);
        transactionData[key] = row[index] || '';
        
        if (header.toLowerCase().includes('transaction id')) {
          transactionId = row[index] || '';
        }
      });

      if (transactionId && transactionId.trim() !== '') {
        transactions.push({
          transactionId: transactionId.trim(),
          category: 'IOTrix',
          data: transactionData,
          teamName: transactionData['team_name'] || '',
          teamLead: transactionData['name_team_leader'] || '',
          email: transactionData['email_team_leader'] || '',
          phone: transactionData['phone_number_whatsapp'] || '',
          institution: transactionData['university_name_team_leader'] || '',
          paymentMethod: transactionData['which_gateway_you_used'] || '',
          paymentNumber: transactionData['number_used_for_payment'] || '',
          timestamp: transactionData['timestamp'] || '',
        });
      }
    }

    return transactions;
  }

  // Parse ApiAvengers data structure
  parseApiAvengers(rows, sourceSheet) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const transactions = [];

    console.log(`Parsing ApiAvengers data with ${dataRows.length} rows`);

    for (const row of dataRows) {
      if (!row || row.length === 0 || row.every(cell => !cell || cell.trim() === '')) {
        continue; // Skip empty rows
      }

      const transactionData = {};
      let transactionId = '';

      headers.forEach((header, index) => {
        if (header && header.trim()) {
          const key = this.sanitizeKey(header);
          transactionData[key] = row[index] || '';
          
          if (header.toLowerCase().includes('transaction id')) {
            transactionId = row[index] || '';
          }
        }
      });

      if (transactionId && transactionId.trim() !== '') {
        const transaction = {
          transactionId: transactionId.trim(),
          category: 'ApiAvengers',
          data: transactionData,
          teamName: transactionData['team_name'] || '',
          teamLead: transactionData['name_team_leader'] || '',
          email: transactionData['email_team_leader'] || transactionData['email_address'] || '',
          phone: transactionData['phone_number_whatsapp'] || '',
          institution: transactionData['university_name_team_leader'] || '',
          paymentMethod: transactionData['which_gateway_you_used'] || '',
          paymentNumber: transactionData['number_used_for_payment'] || '',
          timestamp: transactionData['timestamp'] || '',
        };

        transactions.push(transaction);
      } else {
        console.log('Could not find transaction ID for row:', row);
      }
    }

    console.log(`ApiAvengers: Extracted ${transactions.length} valid transactions`);
    return transactions;
  }

  sanitizeKey(key) {
    return key.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  extractTransactionsFromData(rows, category, sourceSheet) {
    switch (category) {
      case 'StealthFlags':
        return this.parseStealthFlags(rows, sourceSheet);
      case 'AIFication':
        return this.parseAIFication(rows, sourceSheet);
      case 'IOTrix':
        return this.parseIOTrix(rows, sourceSheet);
      case 'ApiAvengers':
        return this.parseApiAvengers(rows, sourceSheet);
      default:
        console.warn(`Unknown category: ${category}`);
        return [];
    }
  }

  async getAllSheetsData() {
    const allData = {};
    
    for (const [category, sheetId] of Object.entries(this.sheetIds)) {
      if (!sheetId) {
        allData[category] = {
          error: `No sheet ID configured for ${category}`,
          transactions: [],
          rows: []
        };
        continue;
      }
      
      try {
        console.log(`\nFetching data for category: ${category}`);
        const rows = await this.fetchSheetData(sheetId, 'A:AF');
        const transactions = this.extractTransactionsFromData(rows, category, sheetId);
        
        allData[category] = {
          rows: rows,
          transactions: transactions,
          sheetId: sheetId,
          count: transactions.length,
          headers: rows.length > 0 ? rows[0] : []
        };

        console.log(`${category}: Extracted ${transactions.length} transactions`);
        
      } catch (error) {
        console.error(`Error processing ${category}:`, error.message);
        allData[category] = {
          error: error.message,
          transactions: [],
          rows: [],
          count: 0
        };
      }
    }
    
    return allData;
  }

  async getSheetData(category) {
    const sheetData = {};
    
    const sheetId = this.sheetIds[category];
    if (!sheetId) {
      sheetData[category] = {
        error: `No sheet ID configured for ${category}`,
        transactions: [],
        rows: []
      };
      return {};
    }
      
    try {
      console.log(`\nFetching data for category: ${category}`);
      const rows = await this.fetchSheetData(sheetId, 'A:AF');
      const transactions = this.extractTransactionsFromData(rows, category, sheetId);
      
      const result = {
        rows: rows,
        transactions: transactions,
        sheetId: sheetId,
        count: transactions.length,
        headers: rows.length > 0 ? rows[0] : []
      };

      console.log(`${category}: Extracted ${transactions.length} transactions`);
      return result;
    } catch (error) {
      console.error(`Error processing ${category}:`, error.message);
      return {
        error: error.message,
        transactions: [],
        rows: [],
        count: 0
      };
    }
  }

  async refreshTransactions(TransactionModel, category = 'all') {
    try {
      console.log('\nStarting transaction refresh...');
      
      let newData = {};
      if (category === 'all') {
        newData = await this.getAllSheetsData();
      } else {
        newData = { [category]: await this.getSheetData(category) };
      }
      
      const allNewTransactions = [];
      const newTransactionsByCategory = {};
      
      for (const [cat, data] of Object.entries(newData)) {
        if (data.transactions && data.transactions.length > 0) {
          newTransactionsByCategory[cat] = data.transactions;
          allNewTransactions.push(...data.transactions);
        }
      }
      
      console.log(`New transactions collected: ${allNewTransactions.length}`);

      if (allNewTransactions.length === 0) {
        return { 
          success: true, 
          count: 0,
          categories: newData,
          message: 'No new transactions found'
        };
      }

      let existingTransactions = [];
      if (category === 'all') {
        existingTransactions = await TransactionModel.find({});
      } else {
        existingTransactions = await TransactionModel.find({ category });
      }

      console.log(`Existing transactions in DB: ${existingTransactions.length}`);

      const existingTransactionMap = new Map();
      existingTransactions.forEach(t => {
        const key = `${t.transactionId}_${t.category}`;
        existingTransactionMap.set(key, t);
      });

      const transactionsToAdd = [];
      const transactionsToUpdate = [];
      
      for (const newTransaction of allNewTransactions) {
        const key = `${newTransaction.transactionId}_${newTransaction.category}`;
        const existingTransaction = existingTransactionMap.get(key);
        
        if (!existingTransaction) {
          transactionsToAdd.push(newTransaction);
        } else {
          if (this.hasTransactionChanged(existingTransaction, newTransaction)) {
            transactionsToUpdate.push({
              id: existingTransaction._id,
              updates: newTransaction
            });
          }
        }
      }

      console.log(`New transactions to add: ${transactionsToAdd.length}`);
      console.log(`Existing transactions to update: ${transactionsToUpdate.length}`);

      let savedCount = 0;
      let updatedCount = 0;

      if (transactionsToAdd.length > 0) {
        const result = await TransactionModel.insertMany(transactionsToAdd);
        savedCount = result.length;
      }

      if (transactionsToUpdate.length > 0) {
        const updateOperations = transactionsToUpdate.map(update => ({
          updateOne: {
            filter: { _id: update.id },
            update: { $set: update.updates }
          }
        }));
        
        const result = await TransactionModel.bulkWrite(updateOperations);
        updatedCount = result.modifiedCount;
      }

      const allAffectedTransactions = [
        ...transactionsToAdd,
        ...transactionsToUpdate.map(t => t.updates)
      ];
      
      const duplicateResult = await this.recalculateDuplicates(
        TransactionModel, 
        allAffectedTransactions,
        category
      );

      console.log(`Saved ${savedCount} new transactions`);
      console.log(`Updated ${updatedCount} existing transactions`);
      console.log(`Duplicate updates: ${duplicateResult.updated}`);

      let finalCount;
      if (category === 'all') {
        finalCount = await TransactionModel.countDocuments({});
      } else {
        finalCount = await TransactionModel.countDocuments({ category });
      }

      return { 
        success: true, 
        count: savedCount,
        updated: updatedCount,
        duplicatesUpdated: duplicateResult.updated,
        total: finalCount,
        categories: newData,
        message: `Added ${savedCount} new transactions, updated ${updatedCount} existing transactions, and updated ${duplicateResult.updated} duplicate markers`
      };
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      throw error;
    }
  }

  hasTransactionChanged(existingTransaction, newTransaction) {
    const fieldsToCompare = [
      'teamName', 'teamLead', 'email', 'phone', 'institution', 
      'paymentMethod', 'paymentNumber', 'timestamp', 'coupon',
      'interest', 'query', 'sourceSheet', 'data',
      'member2Name', 'member2Email', 'member2Phone',
      'member3Name', 'member3Email', 'member3Phone', 
      'member4Name', 'member4Email', 'member4Phone'
    ];

    for (const field of fieldsToCompare) {
      const existingValue = existingTransaction[field];
      const newValue = newTransaction[field];
      
      // Handle undefined/null comparisons
      if (existingValue !== newValue) {
        if (existingValue == null && newValue == null) continue;
        if (existingValue == null || newValue == null) return true;
        
        // String comparison for primitive values
        if (String(existingValue) !== String(newValue)) {
          return true;
        }
      }
    }
    
    return false;
  }

  async recalculateDuplicates(TransactionModel, affectedTransactions, category = 'all') {
    try {
      const affectedTransactionIds = [...new Set(affectedTransactions.map(t => t.transactionId))];
      
      let transactionsToCheck;
      if (category === 'all') {
        transactionsToCheck = await TransactionModel.find({
          transactionId: { $in: affectedTransactionIds }
        });
      } else {
        transactionsToCheck = await TransactionModel.find({
          transactionId: { $in: affectedTransactionIds },
          category: category
        });
      }

      const transactionIdMap = new Map();
      for (const transaction of transactionsToCheck) {
        if (!transactionIdMap.has(transaction.transactionId)) {
          transactionIdMap.set(transaction.transactionId, []);
        }
        transactionIdMap.get(transaction.transactionId).push(transaction);
      }

      const duplicateUpdates = [];
      
      for (const [transactionId, transactions] of transactionIdMap.entries()) {
        const isDuplicate = transactions.length > 1;
        const duplicateOf = isDuplicate ? 
          transactions.filter(t => t.transactionId !== transactionId).map(t => t.transactionId) : 
          [];

        for (const transaction of transactions) {
          if (transaction.isDuplicate !== isDuplicate || 
              JSON.stringify(transaction.duplicateOf || []) !== JSON.stringify(duplicateOf)) {
            duplicateUpdates.push({
              updateOne: {
                filter: { _id: transaction._id },
                update: { 
                  isDuplicate,
                  duplicateOf
                }
              }
            });
          }
        }
      }

      let updatedCount = 0;
      if (duplicateUpdates.length > 0) {
        const result = await TransactionModel.bulkWrite(duplicateUpdates);
        updatedCount = result.modifiedCount;
      }

      return { updated: updatedCount };
    } catch (error) {
      console.error('Error recalculating duplicates:', error);
      return { updated: 0, error: error.message };
    }
  }

}

module.exports = new GoogleSheetsService();