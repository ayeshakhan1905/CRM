const express = require('express');
const router = express.Router();
const { sendRawEmail, sendTemplateEmail } = require('../controllers/emailController');
const protect = require('../middleware/protect');

// only authenticated users can trigger sending
router.post('/send', protect, sendRawEmail);
router.post('/send-template', protect, sendTemplateEmail);

module.exports = router;