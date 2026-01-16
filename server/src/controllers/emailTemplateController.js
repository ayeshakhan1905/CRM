const EmailTemplate = require('../models/emailTemplateModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all email templates for user
// @route   GET /api/email-templates
// @access  Private
const getEmailTemplates = asyncHandler(async (req, res) => {
  const templates = await EmailTemplate.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 });

  res.json(templates);
});

// @desc    Create new email template
// @route   POST /api/email-templates
// @access  Private
const createEmailTemplate = asyncHandler(async (req, res) => {
  const { name, subject, body, variables } = req.body;

  if (!name || !subject || !body) {
    res.status(400);
    throw new Error('Please provide name, subject, and body');
  }

  const template = await EmailTemplate.create({
    name,
    subject,
    body,
    variables: variables || [],
    createdBy: req.user._id
  });

  res.status(201).json(template);
});

// @desc    Update email template
// @route   PUT /api/email-templates/:id
// @access  Private
const updateEmailTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if user owns the template
  if (template.createdBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedTemplate);
});

// @desc    Delete email template
// @route   DELETE /api/email-templates/:id
// @access  Private
const deleteEmailTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if user owns the template
  if (template.createdBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  await EmailTemplate.findByIdAndDelete(req.params.id);

  res.json({ message: 'Template deleted' });
});

module.exports = {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
};