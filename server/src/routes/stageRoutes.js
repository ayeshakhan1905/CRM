const express = require('express');
const router = express.Router();
const {
  createStage,
  getStages,
  getStageById,
  updateStage,
  deleteStage
} = require('../controllers/stageController');
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');
const logAction = require('../middleware/activityLog');

router.post('/', protect, authorize(['admin']), logAction('Stage','created'), createStage);
router.get('/', protect, getStages);
router.get('/:id', protect, getStageById);
router.put('/:id', protect, authorize(['admin']),logAction('Stage','updated'), updateStage);
router.delete('/:id', protect, authorize(['admin']), logAction('Stage','deleted'),deleteStage);

module.exports = router;
