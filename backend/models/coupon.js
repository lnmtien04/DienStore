const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscountAmount: { type: Number, default: null, min: 0 }, // chỉ áp dụng cho percentage
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  usageLimit: { type: Number, default: null, min: 1 }, // null = không giới hạn
  usedCount: { type: Number, default: 0, min: 0 },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // [] = tất cả
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // [] = tất cả
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);