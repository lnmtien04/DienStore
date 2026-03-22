const asyncHandler = require('express-async-handler');
const Coupon = require('../models/coupon');
const Product = require('../models/product');
const Category = require('../models/category');

// @desc    Lấy tất cả coupons (có phân trang, lọc)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const coupons = await Coupon.find(query)
    .populate('applicableProducts', 'name')
    .populate('applicableCategories', 'name')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Coupon.countDocuments(query);
  res.json({ coupons, total, page, totalPages: Math.ceil(total / limit) });
});

// @desc    Lấy danh sách coupon khả dụng (còn hạn, còn lượt, active)
// @route   GET /api/coupons/available
// @access  Public
const getAvailableCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $expr: { $or: [
      { $eq: ['$usageLimit', null] },
      { $lt: ['$usedCount', '$usageLimit'] }
    ]}
  }).select('-__v -createdBy -updatedAt');
  res.json(coupons);
});

// @desc    Lấy coupon theo ID
// @route   GET /api/coupons/:id
// @access  Private/Admin
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate('applicableProducts', 'name')
    .populate('applicableCategories', 'name');
  if (coupon) res.json(coupon);
  else {
    res.status(404);
    throw new Error('Coupon not found');
  }
});

// @desc    Tạo coupon mới
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit, applicableProducts, applicableCategories, isActive } = req.body;

  // Kiểm tra code đã tồn tại chưa
  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    res.status(400);
    throw new Error('Mã khuyến mãi đã tồn tại');
  }

  // Validate ngày
  if (new Date(startDate) >= new Date(endDate)) {
    res.status(400);
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscountAmount: discountType === 'percentage' ? (maxDiscountAmount || null) : null,
    startDate,
    endDate,
    usageLimit: usageLimit || null,
    applicableProducts: applicableProducts || [],
    applicableCategories: applicableCategories || [],
    isActive,
    createdBy: req.user._id,
  });

  res.status(201).json(coupon);
});

// @desc    Cập nhật coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit, applicableProducts, applicableCategories, isActive } = req.body;

  // Nếu thay đổi code, kiểm tra trùng
  if (code && code.toUpperCase() !== coupon.code) {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      res.status(400);
      throw new Error('Mã khuyến mãi đã tồn tại');
    }
    coupon.code = code.toUpperCase();
  }

  coupon.description = description !== undefined ? description : coupon.description;
  coupon.discountType = discountType || coupon.discountType;
  coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
  coupon.minOrderAmount = minOrderAmount !== undefined ? minOrderAmount : coupon.minOrderAmount;
  coupon.maxDiscountAmount = discountType === 'percentage' ? (maxDiscountAmount !== undefined ? maxDiscountAmount : coupon.maxDiscountAmount) : null;
  coupon.startDate = startDate || coupon.startDate;
  coupon.endDate = endDate || coupon.endDate;
  coupon.usageLimit = usageLimit !== undefined ? usageLimit : coupon.usageLimit;
  coupon.applicableProducts = applicableProducts || coupon.applicableProducts;
  coupon.applicableCategories = applicableCategories || coupon.applicableCategories;
  coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;

  const updated = await coupon.save();
  res.json(updated);
});

// @desc    Xóa coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  await coupon.deleteOne();
  res.json({ message: 'Coupon removed' });
});

// @desc    Kiểm tra mã hợp lệ (public)
// @route   POST /api/coupons/validate
// @access  Public (có thể thêm user nếu cần)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount, products } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Mã không hợp lệ');
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    res.status(400);
    throw new Error('Mã đã hết hạn hoặc chưa có hiệu lực');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Mã đã hết lượt sử dụng');
  }

  if (orderAmount < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString()}đ`);
  }

  // Kiểm tra sản phẩm áp dụng nếu có
  if (coupon.applicableProducts.length > 0) {
    const productIds = products.map(p => p.productId);
    const valid = productIds.some(id => coupon.applicableProducts.includes(id));
    if (!valid) {
      res.status(400);
      throw new Error('Mã không áp dụng cho sản phẩm này');
    }
  }

  // Tính toán giảm giá
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  }

  res.json({
    valid: true,
    discountAmount,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    }
  });
});

module.exports = {
  getCoupons,
  getAvailableCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
   getAvailableCoupons,
};