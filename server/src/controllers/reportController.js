const Lead = require("../models/leadModel");
const Deal = require("../models/dealModel");
const Task = require("../models/taskModel");
const User = require("../models/userModel");

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
  if (to) filter.$lte = new Date(to);

  const clean = {};
  if (filter.$gte) clean.$gte = filter.$gte;
  if (filter.$lte) clean.$lte = filter.$lte;

  return Object.keys(clean).length > 0 ? clean : undefined;
};

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