const Lead = require("../models/leadModel");
const Task = require("../models/taskModel");
const Note = require("../models/noteModel");
const Customer = require("../models/customerModel"); // ✅ new
const { buildSearchQuery } = require("../utils/buildSearchQueries");

// Helper: Populate with selected fields
function populateLead(query) {
  return query
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("notes", "content createdAt")
    .populate("tasks", "title status priority dueDate");
}

// @desc Create new lead
const createLead = async (req, res, next) => {
  try {
    const { name, email, phone, status, assignedTo } = req.body;

    // Check if lead with same email or phone already exists
    if (email) {
      const existingEmailLead = await Lead.findOne({ email });
      if (existingEmailLead) {
        return res.status(400).json({ message: "Lead already exists" });
      }
    }

    if (phone) {
      const existingPhoneLead = await Lead.findOne({ phone });
      if (existingPhoneLead) {
        return res.status(400).json({ message: "Lead already exists" });
      }
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      status,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    const populatedLead = await populateLead(Lead.findById(lead._id));
    res.locals.newEntityId = lead._id;
    res.status(201).json(populatedLead);
  } catch (error) {
    next(error);
  }
};

// @desc Get all leads (admin gets all, others only their own)
const getLeads = async (req, res, next) => {
  try {
    let query = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    query = { ...query, ...buildSearchQuery(req.query) };

    const leads = await populateLead(Lead.find(query));
    res.json(leads);
  } catch (error) {
    next(error);
  }
};

// @desc Get single lead
const getLeadById = async (req, res, next) => {
  try {
    const lead = await populateLead(Lead.findById(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

// @desc Update lead
const updateLead = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    // Check if updating email and it already exists in another lead
    if (email) {
      const existingEmailLead = await Lead.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmailLead) {
        return res.status(400).json({ message: "Email already exists for another lead" });
      }
    }

    // Check if updating phone and it already exists in another lead
    if (phone) {
      const existingPhoneLead = await Lead.findOne({ phone, _id: { $ne: req.params.id } });
      if (existingPhoneLead) {
        return res.status(400).json({ message: "Phone already exists for another lead" });
      }
    }

    const lead = await populateLead(
      Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

// @desc Delete lead (cascade delete tasks & notes)
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Delete related tasks
    await Task.deleteMany({ type: "lead", refId: lead._id });

    // Delete related notes
    await Note.deleteMany({ _id: { $in: lead.notes } });

    // Delete the lead itself
    await lead.deleteOne();

    res.json({ message: "Lead and related tasks/notes deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc Convert lead → customer
const convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Create new customer from lead details
    const customer = await Customer.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      createdBy: req.user._id,
      assignedTo: lead.assignedTo || null,
    });

    // Optional: Remove or mark the lead as converted
    await lead.deleteOne();

    res.json({ message: "Lead converted to customer successfully", customer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLead, // ✅ new export
};
