const Customer = require("../models/customerModel");
const Task = require("../models/taskModel");
const Note = require("../models/noteModel");
const {buildSearchQuery} = require("../utils/buildSearchQueries")

// @desc Create new customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, location } = req.body;

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      location,
      createdBy: req.user._id
    });

    res.locals.newEntityId = customer._id;
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all customers (admin gets all, user gets own)
const getCustomers = async (req, res) => {
  try {
    // Restrict non-admin users
    // console.log("hello");
    const baseQuery = req.user.role !== "admin" 
      ? { createdBy: req.user._id }
      : {};

    // Build dynamic filters
    const query = buildSearchQuery(req, baseQuery, ["name", "email"]);
    // console.log("query -> ", query);
    
    const customers = await Customer.find(query)
      .populate("createdBy", "name email");

    // Fetch tasks & notes for each customer
    const customersWithLinks = await Promise.all(
      customers.map(async (customer) => {
        const tasks = await Task.find({ refId: customer._id, type: "customer" })
          .populate("assignedTo", "name email")
          .populate("createdBy", "name email");

        const notes = await Note.find({ refId: customer._id, type: "customer" })
          .populate("createdBy", "name email");

        return { ...customer.toObject(), tasks, notes };
      })
    );

    res.json(customersWithLinks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Get single customer
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Fetch tasks & notes linked to this customer
    const tasks = await Task.find({ refId: customer._id, type: "customer" })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    const notes = await Note.find({ refId: customer._id, type: "customer" })
      .populate("createdBy", "name email");

    res.json({ ...customer.toObject(), tasks, notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Optionally delete related tasks & notes
    await Task.deleteMany({ refId: customer._id, type: "customer" });
    await Note.deleteMany({ refId: customer._id, type: "customer" });

    res.json({ message: "Customer and related tasks/notes deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
  deleteCustomer
};