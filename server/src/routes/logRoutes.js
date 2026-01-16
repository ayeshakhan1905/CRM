const express = require('express');
const router = express.Router();
const { getRecentLogs } = require('../controllers/logController');
const protect = require('../middleware/protect');

// Only admins can view logs
router.get('/', protect,getRecentLogs);

module.exports = router;
