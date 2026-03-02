const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({
        field: e.param,
        message: e.msg
      }))
    });
  }
  next();
};

// ============ AUTH VALIDATION ============
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['admin', 'sales', 'support']).withMessage('Invalid role'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ============ CUSTOMER VALIDATION ============
const validateCreateCustomer = [
  body('name')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone format'),
  body('company')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('location')
    .optional()
    .trim(),
  handleValidationErrors
];

const validateUpdateCustomer = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('phone').optional().trim().matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone format'),
  body('company').optional().trim(),
  body('location').optional().trim(),
  handleValidationErrors
];

const validateId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

// ============ LEAD VALIDATION ============
const validateCreateLead = [
  body('name')
    .trim()
    .notEmpty().withMessage('Lead name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone format'),
  body('status')
    .optional()
    .isIn(['hot', 'warm', 'cold']).withMessage('Invalid status'),
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
];

const validateUpdateLead = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('phone').optional().trim().matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone format'),
  body('status').optional().isIn(['hot', 'warm', 'cold']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
];

// ============ DEAL VALIDATION ============
const validateCreateDeal = [
  body('title')
    .trim()
    .notEmpty().withMessage('Deal title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('customer')
    .notEmpty().withMessage('Customer ID is required')
    .isMongoId().withMessage('Invalid customer ID'),
  body('stage')
    .notEmpty().withMessage('Stage is required')
    .isMongoId().withMessage('Invalid stage ID'),
  body('value')
    .notEmpty().withMessage('Deal value is required')
    .isNumeric().withMessage('Deal value must be a number')
    .custom(v => v >= 0).withMessage('Value must be positive'),
  body('closeDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['In Progress', 'Won', 'Lost']).withMessage('Invalid status'),
  body('description')
    .optional()
    .trim(),
  handleValidationErrors
];

const validateUpdateDeal = [
  param('id').isMongoId().withMessage('Invalid deal ID'),
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('customer').optional().isMongoId().withMessage('Invalid customer ID'),
  body('stage').optional().isMongoId().withMessage('Invalid stage ID'),
  body('value').optional().isNumeric().withMessage('Value must be a number').custom(v => v >= 0).withMessage('Value must be positive'),
  body('closeDate').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['In Progress', 'Won', 'Lost']).withMessage('Invalid status'),
  handleValidationErrors
];

// ============ TASK VALIDATION ============
const validateCreateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description')
    .optional()
    .trim(),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('type')
    .notEmpty().withMessage('Type is required')
    .customSanitizer(v => v && v.toString().trim().toLowerCase())
    .isIn(['lead', 'customer', 'deal']).withMessage('Invalid type'),
  body('refId')
    .notEmpty().withMessage('Reference ID is required')
    .matches(/^[a-fA-F0-9]{24}$/).withMessage('Invalid ID format'),
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
];

const validateUpdateTask = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
  handleValidationErrors
];

// ============ NOTE VALIDATION ============
const validateCreateNote = [
  body('content')
    .trim()
    .notEmpty().withMessage('Note content is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Content must be between 1 and 5000 characters'),
  body('relatedModel')
    .notEmpty().withMessage('Related model is required')
    .customSanitizer(v => {
      if (!v) return v;
      const s = v.toString().trim().toLowerCase();
      return s.charAt(0).toUpperCase() + s.slice(1);
    })
    .custom(v => ['Lead', 'Customer', 'Deal'].includes(v)).withMessage('Invalid model type'),
  body('relatedTo')
    .notEmpty().withMessage('Related ID is required')
    .isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

const validateUpdateNote = [
  param('id').isMongoId().withMessage('Invalid note ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Note content is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Content must be between 1 and 5000 characters'),
  handleValidationErrors
];

// ============ STAGE VALIDATION ============
const validateCreateStage = [
  body('name')
    .trim()
    .notEmpty().withMessage('Stage name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('order')
    .notEmpty().withMessage('Order is required')
    .isNumeric().withMessage('Order must be a number'),
  body('description')
    .optional()
    .trim(),
  handleValidationErrors
];

const validateUpdateStage = [
  param('id').isMongoId().withMessage('Invalid stage ID'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('order').optional().isNumeric().withMessage('Order must be a number'),
  body('description').optional().trim(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateId,
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCreateLead,
  validateUpdateLead,
  validateCreateDeal,
  validateUpdateDeal,
  validateCreateTask,
  validateUpdateTask,
  validateCreateNote,
  validateUpdateNote,
  validateCreateStage,
  validateUpdateStage
};
