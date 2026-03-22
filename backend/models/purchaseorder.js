const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String }, // lưu lại để tra cứu nhanh
  productName: { type: String }, // lưu snapshot
  currentStock: { type: Number }, // tồn tại thời điểm tạo phiếu (có thể không cần)
  quantity: { type: Number, required: true, min: 1 },
  purchasePrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true }, // quantity * purchasePrice
});

const purchaseOrderSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // mã phiếu tự sinh
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String }, // lưu snapshot tên nhà cung cấp
  orderDate: { type: Date, default: Date.now },
  items: [purchaseOrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'approved', 'cancelled'],
    default: 'draft',
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  approvedAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  cancelledAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);