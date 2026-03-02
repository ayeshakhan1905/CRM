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
const { validateCreateStage, validateUpdateStage, validateId } = require('../middleware/validation');

router.post('/', protect, authorize(['admin']), validateCreateStage, logAction('Stage','created'), createStage);
router.get('/', protect, getStages);
router.get('/:id', protect, validateId, getStageById);
router.put('/:id', protect, authorize(['admin']), validateUpdateStage, logAction('Stage','updated'), updateStage);
router.delete('/:id', protect, authorize(['admin']), validateId, logAction('Stage','deleted'),deleteStage);

module.exports = router;
