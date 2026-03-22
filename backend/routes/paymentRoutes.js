const express = require('express');
const router = express.Router();
const { createVNPayPayment, vnpayReturn } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/vnpay', protect, createVNPayPayment);
router.get('/vnpay-return', vnpayReturn);

module.exports = router;