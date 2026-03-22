const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotificationSettings,
  updateNotificationSettings,
} = require('../controllers/notificationController');

// Tất cả các route đều yêu cầu đăng nhập
router.route('/settings')
  .get(protect, getNotificationSettings)
  .put(protect, updateNotificationSettings);

module.exports = router;