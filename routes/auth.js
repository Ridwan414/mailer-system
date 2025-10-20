const express = require('express');
const router = express.Router();
const { cloudflareAccessMiddleware } = require('../middleware/auth');

// Simple endpoint to verify Cloudflare Access is working
router.get('/verify', cloudflareAccessMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Cloudflare Access authentication successful'
  });
});

module.exports = router;