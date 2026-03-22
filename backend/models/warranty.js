const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true }, // số tháng
  description: { type: String },
  warrantyType: {
    type: String,
    enum: ['official', 'store', 'exchange', 'refund'],
    default: 'official'
  },
  applicableType: {
    type: String,
    enum: ['all', 'category', 'brand', 'product'],
    default: 'all'
  },
  applicableIds: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'applicableType' }], // có thể linh hoạt
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Warranty', warrantySchema);