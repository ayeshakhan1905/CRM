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
const createLead = async (req, res) => {
  try {
    const { name, email, phone, status, assignedTo } = req.body;

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
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all leads (admin gets all, others only their own)
const getLeads = async (req, res) => {
  try {
    let query = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    query = { ...query, ...buildSearchQuery(req.query) };

    const leads = await populateLead(Lead.find(query));
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single lead
const getLeadById = async (req, res) => {
  try {
    const lead = await populateLead(Lead.findById(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update lead
const updateLead = async (req, res) => {
  try {
    const lead = await populateLead(
      Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete lead (cascade delete tasks & notes)
const deleteLead = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// @desc Convert lead → customer
const convertLead = async (req, res) => {
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
    res.status(500).json({ message: error.message });
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
