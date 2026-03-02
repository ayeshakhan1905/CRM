const Deal = require("../models/dealModel");
const Customer = require("../models/customerModel");
const Stage = require("../models/stageModel");
const Note = require("../models/noteModel");
const User = require("../models/userModel");
const Task = require("../models/taskModel"); // Added for cascade delete
const { buildSearchQuery } = require("../utils/buildSearchQueries");

// Helper to populate with selected fields
function populateDeal(query) {
  return query
    .populate("customer", "name email")
    .populate("stage", "name order")
    .populate("notes", "content createdAt")
    .populate("createdBy", "name email")
    .populate("tasks", "title status priority dueDate");
}

// Create Deal
exports.createDeal = async function (req, res, next) {
  try {
    // Always set createdBy to the logged-in user
    req.body.createdBy = req.user._id;

    // If assignedTo isn't provided, default to logged-in user
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user._id;
    }

    const [customer, stage, assignedUser] = await Promise.all([
      Customer.findById(req.body.customer),
      Stage.findById(req.body.stage),
      User.findById(req.body.assignedTo) // check assigned user, not createdBy
    ]);

    if (!customer) return res.status(400).json({ error: "Invalid customer ID" });
    // prevent creating a deal against someone else's customer
    if (req.user.role !== 'admin' && customer && !customer.createdBy.equals(req.user._id)) {
      return res.status(400).json({ error: "Cannot create deal for a customer you do not own" });
    }
    if (!stage) return res.status(400).json({ error: "Invalid stage ID" });
    if (!assignedUser) return res.status(400).json({ error: "Invalid assigned user ID" });

    const deal = await Deal.create(req.body);
    const populatedDeal = await populateDeal(Deal.findById(deal._id));
    res.locals.newEntityId = deal._id;
    res.status(201).json(populatedDeal);
  } catch (err) {
    next(err);
  }
};

// Get all Deals
exports.getDeals = async function (req, res, next) {
  try {
    const baseQuery = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    console.log();
    
    let query = { ...baseQuery };

    // Only apply search if query params exist
    if (Object.keys(req.query).length > 0) {
      query = buildSearchQuery(req, baseQuery, [
        "title",
        "description",
        "status"
      ]);
    }

    // console.log("Final query for deals:", query);

    const deals = await populateDeal(Deal.find(query));
    res.json(deals);
  } catch (err) {
    next(err);
  }
};

// Get single Deal
exports.getDealById = async function (req, res, next) {
  try {
    const deal = await populateDeal(Deal.findById(req.params.id));
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(deal);
  } catch (err) {
    next(err);
  }
};

// Update Deal
exports.updateDeal = async function (req, res, next) {
  try {
    const [customer, stage, assignedUser] = await Promise.all([
      req.body.customer ? Customer.findById(req.body.customer) : true,
      req.body.stage ? Stage.findById(req.body.stage) : true,
      req.body.createdBy ? User.findById(req.body.createdBy) : true,
    ])    
    if (customer === null) return res.status(400).json({ error: "Invalid customer ID" });
    // when changing customer ensure ownership
    if (req.body.customer && req.user.role !== 'admin' && customer && !customer.createdBy.equals(req.user._id)) {
      return res.status(400).json({ error: "Cannot assign deal to a customer you do not own" });
    }
    if (stage === null) return res.status(400).json({ error: "Invalid stage ID" });
    if (assignedUser === null) return res.status(400).json({ error: "Invalid assigned user ID" });
    const updatedDeal = await populateDeal(
      Deal.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
    if (!updatedDeal) return res.status(404).json({ error: "Deal not found" });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('deal-updated', {
        id: updatedDeal._id,
        title: updatedDeal.title,
        stage: updatedDeal.stage?.name,
        updatedBy: req.user.name
      });
    }

    res.json(updatedDeal);
  } catch (err) {
    next(err);
  }
};

// Delete Deal with cascade delete
exports.deleteDeal = async function (req, res, next) {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    // Check ownership
    if (req.user.role !== 'admin' && !deal.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: Not allowed' });
    }

    // Delete related tasks
    await Task.deleteMany({ _id: { $in: deal.tasks } });

    // Delete related notes
    await Note.deleteMany({ _id: { $in: deal.notes } });

    // Finally delete the deal
    await deal.deleteOne();

    res.json({ message: "Deal and related tasks/notes deleted successfully" });
  } catch (err) {
    next(err);
  }
};