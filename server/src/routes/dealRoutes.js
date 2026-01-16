var express = require('express');
var router = express.Router();
const {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal
} = require('../controllers/dealsController');
const protect = require('../middleware/protect');
const checkOwnership = require('../middleware/checkOwnership');
const authorize = require('../middleware/authorize');
const logAction = require('../middleware/activityLog');
const Deal = require('../models/dealModel');

router.post('/', protect, logAction('Deal', 'created') ,createDeal);
router.get('/', protect, getDeals);
router.get('/:id', protect, getDealById);
router.put('/:id', protect, checkOwnership(Deal), logAction('Deal','updated'), updateDeal);
router.delete('/:id', protect, checkOwnership(Deal), logAction("Deal",'deleted') , deleteDeal);

module.exports = router;