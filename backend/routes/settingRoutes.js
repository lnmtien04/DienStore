const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingController');

router.use(protect, authorize('admin'));

router.route('/').get(getSettings).put(updateSettings);
console.log('✅ settingController.js loaded');
module.exports = router;