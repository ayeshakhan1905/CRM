// controllers/logController.js
const Log = require('../models/logModel');
const User = require('../models/userModel');

// GET /api/logs?entity=Lead&userId=...&q=...&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=50
exports.getRecentLogs = async (req, res) => {
  try {
    const {
      entity,     // filter by entityType
      userId,     // filter by creator userId
      q,          // free text (action/details/name/email)
      from,       // date from
      to,         // date to
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};
    if (entity) query.entityType = entity;
    if (userId) query.createdBy = userId;

    // Date filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 🔍 If search term exists and not just on logs, include users
    let userIds = [];
    if (q) {
      // Find matching users first
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');

      userIds = matchedUsers.map(u => u._id);

      query.$or = [
        { action: { $regex: q, $options: 'i' } },
        { details: { $regex: q, $options: 'i' } },
        { entityType: { $regex: q, $options: 'i' } },
        { createdBy: { $in: userIds } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10), 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10), 1), 200);

    const [logs, totalLogs] = await Promise.all([
      Log.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate('createdBy', 'name email role'),
      Log.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(totalLogs / perPage),
      totalLogs,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};