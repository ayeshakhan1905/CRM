const Lead = require("../models/leadModel");
const Deal = require("../models/dealModel");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const Customer = require("../models/customerModel");

/**
 * Utility: build date filter from params
 */
const buildDateFilter = (from, to, range) => {
  const filter = {};
  const now = new Date();

  if (range) {
    let start;
    switch (range) {
      case "7d":
        start = new Date();
        start.setDate(now.getDate() - 7);
        filter.$gte = start;
        break;
      case "30d":
        start = new Date();
        start.setDate(now.getDate() - 30);
        filter.$gte = start;
        break;
      case "90d":
        start = new Date();
        start.setDate(now.getDate() - 90);
        filter.$gte = start;
        break;
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        filter.$gte = start;
        break;
      default:
        break;
    }
  }

  if (from) filter.$gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filter.$lte = toDate;
  }

  const clean = {};
  if (filter.$gte) clean.$gte = filter.$gte;
  if (filter.$lte) clean.$lte = filter.$lte;

  return Object.keys(clean).length > 0 ? clean : undefined;
};

exports.buildDateFilter = buildDateFilter;

/**
 * @desc Get all reports (charts)
 * @route GET /api/reports
 * @access Private (admin gets all, user gets own)
 */
exports.getReports = async (req, res) => {
  try {
    const { from, to, userId, range } = req.query;
    const dateFilter = buildDateFilter(from, to, range);
    console.log("📥 Raw query params:", req.query);
    // Who’s data?
    const filterByUser = {};
    if (req.user.role !== "admin") {
      filterByUser.createdBy = req.user._id;   // ✅ fixed
    } else if (userId) {
      filterByUser.createdBy = userId;         // ✅ fixed
    }

    console.log("📊 getReports filters:", {
      role: req.user.role,
      filterByUser,
      dateFilter,
    });

    // Leads Query
    const leadsQuery = { ...filterByUser };
    if (dateFilter) leadsQuery.createdAt = dateFilter;
    console.log("🔎 Leads Query:", leadsQuery);

    const leads = await Lead.aggregate([
      { $match: leadsQuery },
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);
    const totalLeads = await Lead.countDocuments(leadsQuery);

    // Deals Query
    const dealsQuery = { ...filterByUser };
    if (dateFilter) dealsQuery.createdAt = dateFilter;
    console.log("🔎 Deals Query:", dealsQuery);

    const deals = await Deal.aggregate([
      { $match: dealsQuery },
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ]);
    const totalDeals = await Deal.countDocuments(dealsQuery);

    // Tasks Query
    const tasksQuery = { ...filterByUser };
    if (dateFilter) tasksQuery.createdAt = dateFilter;
    console.log("🔎 Tasks Query:", tasksQuery);

    const tasks = await Task.aggregate([
      { $match: tasksQuery },
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ]);
    const totalTasks = await Task.countDocuments(tasksQuery);

    // Timeline
    const timeline = await Task.find(tasksQuery)
      .sort({ createdAt: -1 })
      .limit(20)
      .select("title status createdAt");

    // additional totals
    const customerFilter = { ...filterByUser };
    if (dateFilter) customerFilter.createdAt = dateFilter;
    const totalCustomers = await Customer.countDocuments(customerFilter);

    const leadsConvertedFilter = { ...filterByUser, "deals.0": { $exists: true } };
    if (dateFilter) leadsConvertedFilter.createdAt = dateFilter;
    const totalLeadsConverted = await Lead.countDocuments(leadsConvertedFilter);

    // User performance (admin only)
    let users = [];
    if (req.user.role === "admin") {
      const perfQuery = {};
      if (dateFilter) perfQuery.createdAt = dateFilter;
      if (userId) perfQuery.createdBy = userId;   // ✅ fixed

      users = await Deal.aggregate([
        { $match: perfQuery },
        {
          $group: {
            _id: "$createdBy",   // ✅ fixed
            closedDeals: { $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] } },
            totalRevenue: { $sum: "$amount" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            userId: "$user._id",
            name: "$user.name",
            email: "$user.email",
            closedDeals: 1,
            totalRevenue: 1,
          },
        },
      ]);
    }

    res.json({
      success: true,
      data: {
        leads,
        totalLeads,
        leadsConverted: totalLeadsConverted,
        totalCustomers,
        deals,
        totalDeals,
        tasks,
        totalTasks,
        timeline,
        users,
      },
    });
  } catch (err) {
    console.error("❌ getReports error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get sales users (for admin filters)
 * @route GET /api/reports/users
 * @access Private/Admin
 */
exports.getReportUsers = async (req, res) => {
  try {
    console.log("👑 Admin fetching report users…");

    const users = await User.find({ role: "sales" }).select("_id name email");
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("❌ getReportUsers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get all users with activity summary (admin only)
 * @route GET /api/reports/all-users
 * @access Private/Admin
 */
exports.getAllUsersWithActivity = async (req, res) => {
  try {
    console.log("👑 Admin fetching all users with activity…");

    const { page = 1, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get paginated users
    const users = await User.find({ role: { $in: ["admin", "sales"] } })
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalUsers = await User.countDocuments({ role: { $in: ["admin", "sales"] } });

    // Get activity counts for each user
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const userId = user._id;

        const leadCount = await Lead.countDocuments({ createdBy: userId });
        const dealCount = await Deal.countDocuments({ createdBy: userId });
        const customerCount = await Customer.countDocuments({ createdBy: userId });
        const taskCount = await Task.countDocuments({ createdBy: userId });

        const wonDeals = await Deal.find({ createdBy: userId, status: "won" });
        const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          activity: {
            leads: leadCount,
            deals: dealCount,
            customers: customerCount,
            tasks: taskCount,
            totalRevenue: totalRevenue,
          },
        };
      })
    );

    res.json({
      success: true,
      data: usersWithActivity,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        hasNext: pageNum * limitNum < totalUsers,
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error("❌ getAllUsersWithActivity error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get detailed deals for a user
 * @route GET /api/reports/user-deals
 * @access Private
 */
exports.getUserDeals = async (req, res) => {
  try {
    const { from, to, range } = req.query;
    const dateFilter = buildDateFilter(from, to, range);

    // Who’s data?
    const filterByUser = {};
    if (req.user.role !== "admin") {
      filterByUser.createdBy = req.user._id;
    }

    const dealsQuery = { ...filterByUser };
    if (dateFilter) dealsQuery.createdAt = dateFilter;

    const deals = await Deal.find(dealsQuery)
      .populate("customer", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .select("title amount status stage customer createdBy createdAt updatedAt");

    res.json({ success: true, data: deals });
  } catch (err) {
    console.error("❌ getUserDeals error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get detailed activities summary for a user
 * @route GET /api/reports/user-activities
 * @access Private
 */
exports.getUserActivities = async (req, res) => {
  try {
    const { from, to, range } = req.query;
    const dateFilter = buildDateFilter(from, to, range);

    // Who’s data?
    const filterByUser = {};
    if (req.user.role !== "admin") {
      filterByUser.createdBy = req.user._id;
    }

    const baseQuery = { ...filterByUser };
    if (dateFilter) baseQuery.createdAt = dateFilter;

    // Get recent activities from different models
    const [leads, deals, customers, tasks] = await Promise.all([
      Lead.find(baseQuery)
        .populate("customer", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name email phone status createdAt customer"),

      Deal.find(baseQuery)
        .populate("customer", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title amount status stage customer createdAt"),

      Customer.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name email phone createdAt"),

      Task.find(baseQuery)
        .populate("relatedTo", "name title")
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title description status priority dueDate relatedTo relatedModel createdAt")
    ]);

    // Combine and sort all activities
    const activities = [
      ...leads.map(item => ({ ...item.toObject(), type: 'lead', timestamp: item.createdAt })),
      ...deals.map(item => ({ ...item.toObject(), type: 'deal', timestamp: item.createdAt })),
      ...customers.map(item => ({ ...item.toObject(), type: 'customer', timestamp: item.createdAt })),
      ...tasks.map(item => ({ ...item.toObject(), type: 'task', timestamp: item.createdAt }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error("❌ getUserActivities error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserLeads = async (req, res) => {
  try {
    const userId = req.user._id;
    const { range, from, to, page = 1, limit = 5 } = req.query;

    // Build date filter
    const dateFilter = buildDateFilter(range, from, to);

    // Build user filter based on role
    let userFilter = {};
    if (req.user.role !== 'admin') {
      userFilter.createdBy = userId;
    } else if (req.query.userId) {
      userFilter.createdBy = req.query.userId;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get leads with pagination
    const leads = await Lead.find({
      ...userFilter,
      ...dateFilter
    })
    .populate('customer', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('name email phone status source notes createdAt updatedAt customer createdBy');

    // Get total count for pagination
    const totalLeads = await Lead.countDocuments({
      ...userFilter,
      ...dateFilter
    });

    // For each lead, get associated tasks
    const leadsWithTasks = await Promise.all(
      leads.map(async (lead) => {
        const tasks = await Task.find({
          $or: [
            { relatedTo: lead._id },
            { relatedTo: lead.customer?._id }
          ]
        })
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title status priority dueDate assignedTo');

        return {
          ...lead.toObject(),
          tasks: tasks
        };
      })
    );

    res.json({
      success: true,
      data: leadsWithTasks,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalLeads / limitNum),
        totalLeads,
        hasNext: pageNum * limitNum < totalLeads,
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error("❌ getUserLeads error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get all prospects (leads + customers combined)
 * @route GET /api/reports/prospects
 * @access Private
 */
exports.getProspects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { range, from, to, page = 1, limit = 10 } = req.query;

    // Build date filter
    const dateFilter = buildDateFilter(range, from, to);

    // Build user filter based on role
    let userFilter = {};
    if (req.user.role !== 'admin') {
      userFilter.createdBy = userId;
    } else if (req.query.userId) {
      userFilter.createdBy = req.query.userId;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get all leads
    const leads = await Lead.find({
      ...userFilter,
      ...dateFilter
    })
      .populate('customer', 'name email')
      .populate('deals', '_id title status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .select('name email phone status notes createdAt updatedAt customer deals');

    // Get all customers
    const customers = await Customer.find({
      ...userFilter,
      ...dateFilter
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .select('name email phone createdAt updatedAt');

    // Combine and format prospects
    const prospects = [
      ...leads.map(lead => ({
        _id: lead._id,
        type: 'lead',
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status || 'N/A',
        notes: lead.notes,
        deals: lead.deals,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      })),
      ...customers.map(customer => ({
        _id: customer._id,
        type: 'customer',
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: 'Customer',
        notes: [],
        deals: [],
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get total count
    const totalLeads = await Lead.countDocuments({ ...userFilter, ...dateFilter });
    const totalCustomers = await Customer.countDocuments({ ...userFilter, ...dateFilter });
    const total = totalLeads + totalCustomers;

    // Apply pagination to combined results
    const paginatedProspects = prospects.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: paginatedProspects,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error("❌ getProspects error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};