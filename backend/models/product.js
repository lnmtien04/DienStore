const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  // Các trường mới
  importPrice: { type: Number, min: 0, default: 0 },
  origin: { type: String, default: '' },
  warranty: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty', default: null }, // đổi ref cho đúng (nếu model là Warranty)
  brand: { type: String, default: '' },
  images: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  // Các trường bổ sung cho frontend
  sold: { type: Number, default: 0 },               // số lượng đã bán
  rating: { type: Number, default: 0, min: 0, max: 5 }, // điểm đánh giá trung bình
  reviewCount: { type: Number, default: 0 },        // số lượt đánh giá
  views: { type: Number, default: 0 },               // lượt xem
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema, 'Products');