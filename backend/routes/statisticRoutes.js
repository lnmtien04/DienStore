const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getRevenueStatistics,
  getTopProducts,
  getDashboardStats
} = require('../controllers/statisticController');

router.use(protect, authorize('admin'));

router.get('/revenue', getRevenueStatistics);
router.get('/top-products', getTopProducts);
router.get('/dashboard', getDashboardStats);

module.exports = router;