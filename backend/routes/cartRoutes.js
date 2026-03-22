const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);

module.exports = router;