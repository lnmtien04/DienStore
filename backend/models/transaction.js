const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['import', 'export', 'adjustment', 'audit'], required: true },
  quantity: { type: Number, required: true },
  stockBefore: { type: Number, required: true },
  stockAfter: { type: Number, required: true },
  referenceType: { type: String, enum: ['order', 'purchase', 'audit', 'manual'], default: 'manual' },
  referenceId: { type: String },
  note: { type: String },
  transactionCode: { type: String, unique: true, sparse: true },
 createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);