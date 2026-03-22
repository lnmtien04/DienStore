const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  systemStock: { type: Number, required: true },
  actualStock: { type: Number, required: true },
  difference: { type: Number, required: true }, // actual - system
  note: { type: String },
});

const auditSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  warehouse: { type: String, default: 'main' }, // nếu có nhiều kho
  status: {
    type: String,
    enum: ['draft', 'completed', 'cancelled'],
    default: 'draft',
  },
  items: [auditItemSchema],
  totalDifference: { type: Number, default: 0 },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audit', auditSchema);