const Deal = require("../models/dealModel");
const Customer = require("../models/customerModel");
const Stage = require("../models/stageModel");
const Note = require("../models/noteModel");
const User = require("../models/userModel");
const Task = require("../models/taskModel"); // Added for cascade delete
const Lead = require("../models/leadModel"); // Added for lead-deal linking
const { buildSearchQuery } = require("../utils/buildSearchQueries");

// Helper to populate with selected fields
function populateDeal(query) {
  return query
    .populate("customers", "name email")
    .populate("customer", "name email") // Also populate old customer field for backward compatibility
    .populate("stage", "name order")
    .populate("lead", "name email")
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

    // Support both old format (customer) and new format (customers array)
    let customerIds = req.body.customers || [];
    if (!customerIds.length && req.body.customer) {
      customerIds = [req.body.customer];
    }

    if (!customerIds.length) {
      return res.status(400).json({ error: "At least one customer is required" });
    }

    const [customers, stage, assignedUser, lead] = await Promise.all([
      Promise.all(customerIds.map(id => Customer.findById(id))),
      Stage.findById(req.body.stage),
      User.findById(req.body.assignedTo),
      req.body.lead ? Lead.findById(req.body.lead) : null
    ]);

    // Validate customers exist and user has permission
    const invalidCustomers = customers.filter(c => !c);
    if (invalidCustomers.length > 0) return res.status(400).json({ error: "Invalid customer ID(s)" });
    
    // Check ownership for non-admin users
    if (req.user.role !== 'admin') {
      const unownedCustomers = customers.filter(c => !c.createdBy.equals(req.user._id));
      if (unownedCustomers.length > 0) {
        return res.status(400).json({ error: "Cannot create deal for customers you do not own" });
      }
    }

    if (!stage) return res.status(400).json({ error: "Invalid stage ID" });
    if (!assignedUser) return res.status(400).json({ error: "Invalid assigned user ID" });
    if (req.body.lead && !lead) return res.status(400).json({ error: "Invalid lead ID" });
    // prevent creating a deal against someone else's lead
    if (req.body.lead && req.user.role !== 'admin' && lead && !lead.createdBy.equals(req.user._id)) {
      return res.status(400).json({ error: "Cannot create deal for a lead you do not own" });
    }

    // Use customers array for new deals
    req.body.customers = customerIds;
    delete req.body.customer; // Remove old format

    const deal = await Deal.create(req.body);

    // If lead is provided, link the deal to the lead
    if (req.body.lead) {
      await Lead.findByIdAndUpdate(req.body.lead, { $push: { deals: deal._id } });
    }

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

    // allow admin to filter by specific creator
    if (req.query.createdBy && req.user.role === "admin") {
      baseQuery.createdBy = req.query.createdBy;
    }

    let query = { ...baseQuery };

    // Only apply search if query params exist
    if (Object.keys(req.query).length > 0) {
      query = buildSearchQuery(req, baseQuery, [
        "title",
        "description",
        "status"
      ]);
    }

    let deals = await populateDeal(Deal.find(query));
    
    // Normalize deals: convert old format (customer) to new format (customers)
    deals = deals.map(deal => {
      const dealObj = deal.toObject ? deal.toObject() : deal;
      if (dealObj.customer && !dealObj.customers?.length) {
        dealObj.customers = [dealObj.customer];
      }
      return dealObj;
    });
    
    res.json(deals);
  } catch (err) {
    next(err);
  }
};

// Get single Deal
exports.getDealById = async function (req, res, next) {
  try {
    let deal = await populateDeal(Deal.findById(req.params.id));
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    
    // Normalize: convert old format (customer) to new format (customers)
    const dealObj = deal.toObject ? deal.toObject() : deal;
    if (dealObj.customer && !dealObj.customers?.length) {
      dealObj.customers = [dealObj.customer];
    }
    
    res.json(dealObj);
  } catch (err) {
    next(err);
  }
};

// Update Deal
exports.updateDeal = async function (req, res, next) {
  try {
    // Support both formats when updating
    if (req.body.customer && !req.body.customers) {
      req.body.customers = [req.body.customer];
      delete req.body.customer;
    }

    // Validate customers if provided
    if (req.body.customers && Array.isArray(req.body.customers)) {
      const customers = await Promise.all(
        req.body.customers.map(id => Customer.findById(id))
      );
      const invalidCustomers = customers.filter(c => !c);
      if (invalidCustomers.length > 0) return res.status(400).json({ error: "Invalid customer ID(s)" });
      
      // Check ownership
      if (req.user.role !== 'admin') {
        const unownedCustomers = customers.filter(c => !c.createdBy.equals(req.user._id));
        if (unownedCustomers.length > 0) {
          return res.status(400).json({ error: "Cannot assign deal to customers you do not own" });
        }
      }
    }

    if (req.body.stage) {
      const stage = await Stage.findById(req.body.stage);
      if (!stage) return res.status(400).json({ error: "Invalid stage ID" });
    }
    
    if (req.body.assignedTo) {
      const assignedUser = await User.findById(req.body.assignedTo);
      if (!assignedUser) return res.status(400).json({ error: "Invalid assigned user ID" });
    }

    const updatedDeal = await populateDeal(
      Deal.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
    if (!updatedDeal) return res.status(404).json({ error: "Deal not found" });

    // Normalize the response
    const dealObj = updatedDeal.toObject ? updatedDeal.toObject() : updatedDeal;
    if (dealObj.customer && !dealObj.customers?.length) {
      dealObj.customers = [dealObj.customer];
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('deal-updated', {
        id: dealObj._id,
        title: dealObj.title,
        stage: dealObj.stage?.name,
        updatedBy: req.user.name
      });
    }

    res.json(dealObj);
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