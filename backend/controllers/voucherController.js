const asyncHandler = require('express-async-handler');
const Voucher = require('../models/voucher');

// @desc    Lấy danh sách voucher khả dụng (còn hạn, còn lượt, active)
// @route   GET /api/vouchers/available
// @access  Public (hoặc protect tùy bạn)
const getAvailableVouchers = asyncHandler(async (req, res) => {
  const now = new Date();
  const vouchers = await Voucher.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $expr: { $lt: ['$usageCount', '$usageLimit'] } // còn lượt
  }).select('-__v');
  res.json(vouchers);
});

// @desc    Kiểm tra và áp dụng mã (dùng cho radio, không cần kiểm tra riêng)
// @route   POST /api/vouchers/check
// @access  Public
const checkVoucher = asyncHandler(async (req, res) => {
  const { code, total } = req.body;
  const voucher = await Voucher.findOne({ code, isActive: true });
  if (!voucher) {
    return res.status(404).json({ valid: false, message: 'Mã không tồn tại' });
  }
  const now = new Date();
  if (now < voucher.startDate || now > voucher.endDate) {
    return res.status(400).json({ valid: false, message: 'Mã đã hết hạn' });
  }
  if (voucher.usageCount >= voucher.usageLimit) {
    return res.status(400).json({ valid: false, message: 'Mã đã hết lượt sử dụng' });
  }
  if (voucher.minOrderValue > total) {
    return res.status(400).json({ valid: false, message: `Đơn hàng tối thiểu ${voucher.minOrderValue}đ` });
  }
  // Tính giảm giá
  let discountAmount = 0;
  if (voucher.discountType === 'percentage') {
    discountAmount = (total * voucher.discountValue) / 100;
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
  } else {
    discountAmount = voucher.discountValue;
  }
  res.json({
    valid: true,
    voucher,
    discountAmount
  });
});

module.exports = { getAvailableVouchers, checkVoucher };