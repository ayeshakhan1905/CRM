const Lead = require('../models/leadModel');
const Deal = require('../models/dealModel');
const Customer = require('../models/customerModel');
const Task = require('../models/taskModel');
const Note = require('../models/noteModel');
const Log = require('../models/logModel');

// Get total counts for main entities
exports.getCounts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const userFilter = isAdmin ? {} : { createdBy: req.user._id };

    const [leads, deals, customers, tasks, notes, dealsByStage] =
      await Promise.all([
        Lead.countDocuments(userFilter),
        Deal.countDocuments(userFilter),
        Customer.countDocuments(userFilter),
        Task.countDocuments(userFilter),
        Note.countDocuments(userFilter),
        Deal.aggregate([
          { $match: userFilter },
          {
            $group: {
              _id: "$stage",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    // Convert aggregation to nicer object { stageName: count }
    const stageCounts = {};
    dealsByStage.forEach((s) => {
      stageCounts[s._id] = s.count;
    });

    res.json({
      leads,
      deals,
      customers,
      tasks,
      notes,
      dealsByStage: stageCounts,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Deals by stage
exports.getDealsByStage = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const userFilter = isAdmin ? {} : { createdBy: req.user._id };

    const dealsByStage = await Deal.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' } // assuming deal has a 'value' field
        }
      }
    ]);

    res.json(dealsByStage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Lead → Customer conversion rate
exports.getConversionRate = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments({ user: req.user._id });
    const converted = await Customer.countDocuments({ user: req.user._id });

    const rate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(2) : 0;

    res.json({ totalLeads, converted, conversionRate: rate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Comprehensive conversion rates
exports.getConversionRates = async (req, res) => {
  try {
    // TEMPORARY: Remove user filter to test if data exists
    const testFilter = {}; // isAdmin ? {} : { createdBy: req.user._id };

    // Get total counts
    const [totalLeads, totalDeals, totalCustomers, dealsWithLeads, dealsByStatus] = await Promise.all([
      Lead.countDocuments(testFilter),
      Deal.countDocuments(testFilter),
      Customer.countDocuments(testFilter),
      Deal.countDocuments({ ...testFilter, lead: { $exists: true, $ne: null } }), // Deals created from leads
      Deal.aggregate([
        { $match: testFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      ])
    ]);

    // Calculate conversion rates
    const leadToDealRate = totalLeads > 0 ? ((dealsWithLeads / totalLeads) * 100) : 0;
    const wonDeals = dealsByStatus.find(d => d._id === 'Won')?.count || 0;
    const dealWinRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100) : 0;

    // For deal to customer rate, since all deals have customers, use win rate
    const dealToCustomerRate = dealWinRate;

    // Overall conversion: leads that have won deals
    // This is approximate - leads that have deals that are won
    const wonDealsWithLeads = await Deal.countDocuments({
      ...testFilter,
      status: 'Won',
      lead: { $exists: true, $ne: null }
    });
    const overallConversionRate = totalLeads > 0 ? ((wonDealsWithLeads / totalLeads) * 100) : 0;

    res.json({
      leadToDealRate: parseFloat(leadToDealRate.toFixed(2)),
      dealToCustomerRate: parseFloat(dealWinRate.toFixed(2)), // Using win rate as deal-to-customer
      overallConversionRate: parseFloat(overallConversionRate.toFixed(2)),
      dealWinRate: parseFloat(dealWinRate.toFixed(2)),
      // Additional details for debugging
      totals: {
        totalLeads,
        totalDeals,
        totalCustomers,
        dealsWithLeads,
        wonDeals,
        wonDealsWithLeads
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Recent activity (last 10 actions)
exports.getRecentActivity = async (req, res) => {
  try {
    // query logs by creator, not "user" field (schema uses createdBy)
    const recent = await Log.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Optional: Revenue per stage
exports.getRevenueByStage = async (req, res) => {
  try {
    const revenue = await Deal.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: '$stage',
          totalRevenue: { $sum: '$value' }
        }
      }
    ]);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
