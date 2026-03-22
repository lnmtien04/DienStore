const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/activitylog');

// @desc    Lấy danh sách activity log (có phân trang, lọc)
// @route   GET /api/logs
// @access  Admin
const getLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId, action, fromDate, toDate } = req.query;
  const query = {};

  if (userId) query.user = userId;
  if (action) query.action = action;
  if (fromDate || toDate) {
    query.timestamp = {};
    if (fromDate) query.timestamp.$gte = new Date(fromDate);
    if (toDate) query.timestamp.$lte = new Date(toDate);
  }

  const logs = await ActivityLog.find(query)
    .populate('user', 'fullName email')
    .sort('-timestamp')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await ActivityLog.countDocuments(query);

  res.json({
    logs,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

// @desc    Lấy chi tiết một log
// @route   GET /api/logs/:id
// @access  Admin
const getLogById = asyncHandler(async (req, res) => {
  const log = await ActivityLog.findById(req.params.id).populate('user', 'fullName email');
  if (!log) {
    res.status(404);
    throw new Error('Log không tồn tại');
  }
  res.json(log);
});

module.exports = { getLogs, getLogById };