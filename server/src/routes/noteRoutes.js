const express = require("express");
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote
} = require("../controllers/notesController");
const protect  = require("../middleware/protect");
const checkOwnership = require("../middleware/checkOwnership");
const logAction = require("../middleware/activityLog");
const Note = require("../models/noteModel");
const { validateCreateNote, validateUpdateNote, validateId } = require("../middleware/validation");

const router = express.Router();

router.route("/")
  .post(protect, validateCreateNote, logAction('Note','created') ,createNote)
  .get(protect, getNotes);

router.route("/:id")
  .put(protect, validateUpdateNote, checkOwnership (Note), logAction('Note','updated'), updateNote)
  .delete(protect, validateId, checkOwnership(Note), logAction('Note','deleted'), deleteNote);

module.exports = router;
