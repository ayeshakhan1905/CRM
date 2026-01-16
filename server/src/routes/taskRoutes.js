const express = require("express");
const router = express.Router();
const {createTask, getTasks, getTaskById, updateTask, deleteTask} = require("../controllers/taskController");
const protect  = require("../middleware/protect");
const checkOwnership = require("../middleware/checkOwnership");
const logAction = require("../middleware/activityLog");
const Task = require("../models/taskModel");

router.post('/', protect,logAction('Task','created'), createTask);
router.get('/', protect, getTasks); 
router.get('/:id', protect, getTaskById);

router.put('/:id', protect, checkOwnership(Task),logAction('Task','updated'), updateTask);
router.delete('/:id', protect, checkOwnership(Task),logAction('Task','deleted'), deleteTask);

module.exports = router;