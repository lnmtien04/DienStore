const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  // Có thể thêm meta SEO nếu cần
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);