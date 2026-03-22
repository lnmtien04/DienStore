const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['import', 'export', 'adjust'], required: true }, // loại giao dịch
  quantity: { type: Number, required: true }, // số lượng thay đổi (dương với nhập, âm với xuất)
  previousStock: { type: Number, required: true }, // tồn trước khi thay đổi
  newStock: { type: Number, required: true }, // tồn sau khi thay đổi
  note: { type: String }, // ghi chú
  reference: { type: String }, // tham chiếu (ví dụ mã đơn hàng, phiếu nhập)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema, 'inventories');