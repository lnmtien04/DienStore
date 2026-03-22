const asyncHandler = require('express-async-handler');
const Setting = require('../models/setting');

// @desc    Lấy cài đặt (luôn trả về document đầu tiên, nếu chưa có thì tạo mới)
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  res.json(settings);
});

// @desc    Cập nhật cài đặt
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting();
  }

  // Duyệt qua từng key trong req.body và cập nhật linh hoạt
  Object.keys(req.body).forEach((key) => {
    const value = req.body[key];
    // Nếu value là object và không phải mảng, merge thay vì ghi đè toàn bộ
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      settings[key] = { ...(settings[key] || {}), ...value };
    } else {
      settings[key] = value;
    }
  });

  const updated = await settings.save();
  res.json(updated);
});

module.exports = { getSettings, updateSettings };