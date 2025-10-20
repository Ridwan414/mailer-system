const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { cloudflareAccessMiddleware } = require('../middleware/auth');

// Apply Cloudflare Access middleware to all routes
router.use(cloudflareAccessMiddleware);

router.post('/send', emailController.sendTransactionEmail);
router.post('/send-bulk', emailController.sendBulkEmails);
router.get('/history', emailController.getEmailHistory);
router.get('/stats', emailController.getEmailStats);

module.exports = router;