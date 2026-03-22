const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getAvailableCoupons ,
} = require('../controllers/couponController');

// Public route để kiểm tra mã (không cần đăng nhập)
router.post('/validate', validateCoupon);

// Public route để lấy danh sách coupon khả dụng
router.get('/available', getAvailableCoupons);
// Admin routes
router.use(protect, authorize('admin'));

router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.route('/:id')
  .get(getCouponById)
  .put(updateCoupon)
  .delete(deleteCoupon);

module.exports = router;