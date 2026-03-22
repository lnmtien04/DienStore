const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getOrders,
  getOrderById,
  createOrder,
  confirmReceived,
  cancelOrder,
  updateOrderStatus,
  deleteOrder,
  updateOrder,
  getOrderCounts,
  getOrderHistory,
  getNeedReviewCount,
} = require('../controllers/orderController');

router.use(protect);

// Các route tĩnh (không có tham số) nên đặt trước route động
router.get('/counts', getOrderCounts);
router.get('/history', getOrderHistory);
router.get('/need-review-count', getNeedReviewCount); // 👈 ĐẶT TRƯỚC

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.patch('/:id/receive', confirmReceived);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/status', authorize('admin'), updateOrderStatus);

router.route('/:id')
  .get(getOrderById)
  .delete(authorize('admin'), deleteOrder)
  .put(authorize('admin'), updateOrder);

module.exports = router;