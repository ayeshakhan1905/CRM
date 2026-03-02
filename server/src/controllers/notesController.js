const mongoose = require("mongoose");
const Note = require("../models/noteModel");
const Customer = require("../models/customerModel");
const Lead = require("../models/leadModel");
const Deal = require("../models/dealModel");
const { buildSearchQuery } = require("../utils/buildSearchQueries");

// Utility to normalize relatedModel into enum format
function normalizeModel(model) {
  if (!model) return null;
  const lower = model.toString().trim().toLowerCase();

  if (lower === "lead" || lower === "leads") return "Lead";
  if (lower === "customer" || lower === "customers") return "Customer";
  if (lower === "deal" || lower === "deals") return "Deal";

  return null; // invalid
}

// @desc Create a note
exports.createNote = async (req, res) => {
  try {
    const { content, relatedModel, relatedTo } = req.body;
    const normalizedModel = normalizeModel(relatedModel);
    console.log(req.body);
    console.log(normalizedModel);
    if (!normalizedModel) {
      return res.status(400).json({ message: "Invalid relatedModel provided" });
    }

    // Validate parent
    let parentDoc;
    if (normalizedModel === "Lead") {
      parentDoc = await Lead.findById(relatedTo);
    } else if (normalizedModel === "Customer") {
      parentDoc = await Customer.findById(relatedTo);
    } else if (normalizedModel === "Deal") {
      parentDoc = await Deal.findById(relatedTo);
    }

    if (!parentDoc) {
      return res.status(404).json({ message: `${normalizedModel} not found` });
    }

    // enforce ownership: non-admin users may only add notes to their own entities
    if (req.user.role !== 'admin') {
      // most parent documents have a `createdBy` field
      if (parentDoc.createdBy && parentDoc.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden: cannot add note to entity you do not own' });
      }
    }

    // Create note
    const note = await Note.create({
      content,
      relatedModel: normalizedModel,
      relatedTo,
      createdBy: req.user._id,
    });

    // Add reference to parent
    if (!parentDoc.notes) parentDoc.notes = [];
    parentDoc.notes.push(note._id);
    await parentDoc.save();

    // 🔑 Populate before sending response
    const populatedNote = await Note.findById(note._id)
      .populate("createdBy", "name email")
      .populate("relatedTo", "name");

    res.locals.newEntityId = note._id;
    res.status(201).json(populatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get notes
exports.getNotes = async (req, res) => {
  try {
    let query = {};
    if (req.query.relatedModel) {
      const normalizedModel = normalizeModel(req.query.relatedModel);

      if (!normalizedModel) {
        return res.status(400).json({ message: "Invalid relatedModel provided" });
      }
      query.relatedModel = normalizedModel;
    }

    if (req.query.relatedTo) query.relatedTo = req.query.relatedTo;

    if (req.user.role !== "admin") {
      query.createdBy = req.user._id;
    }

    query = { ...query, ...buildSearchQuery(req.query) };

    // 🔑 Populate for list too
    const notes = await Note.find(query)
      .populate("createdBy", "name email role")
      .populate("relatedTo", "name")
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update note
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true }
    )
      .populate("createdBy", "name email")
      .populate("relatedTo", "name");

    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete note
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Remove from parent
    if (note.relatedModel === "Lead") {
      await Lead.findByIdAndUpdate(note.relatedTo, { $pull: { notes: note._id } });
    }
    if (note.relatedModel === "Customer") {
      await Customer.findByIdAndUpdate(note.relatedTo, { $pull: { notes: note._id } });
    }
    if (note.relatedModel === "Deal") {
      await Deal.findByIdAndUpdate(note.relatedTo, { $pull: { notes: note._id } });
    }

    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};