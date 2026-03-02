const express = require("express");
const router = express.Router();
const {createTask, getTasks, getTaskById, updateTask, deleteTask} = require("../controllers/taskController");
const protect  = require("../middleware/protect");
const checkOwnership = require("../middleware/checkOwnership");
const logAction = require("../middleware/activityLog");
const Task = require("../models/taskModel");
const { validateCreateTask, validateUpdateTask, validateId } = require("../middleware/validation");

router.post('/', protect, validateCreateTask, logAction('Task','created'), createTask);
router.get('/', protect, getTasks); 
router.get('/:id', protect, validateId, getTaskById);

router.put('/:id', protect, validateUpdateTask, checkOwnership(Task), logAction('Task','updated'), updateTask);
router.delete('/:id', protect, validateId, checkOwnership(Task), logAction('Task','deleted'), deleteTask);

module.exports = router;