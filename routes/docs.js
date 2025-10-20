const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');
const { cloudflareAccessMiddleware } = require('../middleware/auth');

// Apply Cloudflare Access middleware to all routes
router.use(cloudflareAccessMiddleware);

router.get('/', docsController.getAllData);
router.get('/refresh', docsController.refreshData);
router.get('/category/:category', docsController.getCategoryData);
router.get('/search', docsController.searchTransactions);
router.get('/duplicates', docsController.getDuplicatesReport);
router.get('/stats', docsController.getStats);

module.exports = router;