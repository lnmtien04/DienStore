const asyncHandler = require('express-async-handler');
const NotificationSetting = require('../models/notificationSetting');

// @desc    Lấy cài đặt thông báo của user hiện tại
// @route   GET /api/notifications/settings
// @access  Private
const getNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let settings = await NotificationSetting.findOne({ user: userId });

  if (!settings) {
    // Nếu chưa có, tạo mới với giá trị mặc định
    settings = await NotificationSetting.create({ user: userId });
  }

  res.json(settings);
});

// @desc    Cập nhật cài đặt thông báo
// @route   PUT /api/notifications/settings
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderUpdates, promotions, emailNotifications, smsNotifications } = req.body;

  let settings = await NotificationSetting.findOne({ user: userId });

  if (!settings) {
    settings = new NotificationSetting({ user: userId });
  }

  if (orderUpdates !== undefined) settings.orderUpdates = orderUpdates;
  if (promotions !== undefined) settings.promotions = promotions;
  if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
  if (smsNotifications !== undefined) settings.smsNotifications = smsNotifications;

  await settings.save();

  res.json(settings);
});

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
};