const express = require('express');
const router = express.Router();
const {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} = require('../controllers/emailTemplateController');
const protect = require('../middleware/protect');

router.route('/')
  .get(protect, getEmailTemplates)
  .post(protect, createEmailTemplate);

router.route('/:id')
  .put(protect, updateEmailTemplate)
  .delete(protect, deleteEmailTemplate);

module.exports = router;