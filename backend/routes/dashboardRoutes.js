const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

// dashboardRoutes.js
router.get('/', protect, authorize('admin', 'staff'), getDashboardStats);

module.exports = router;