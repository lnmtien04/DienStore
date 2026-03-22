const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  reviewed: { type: Boolean, default: false }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    district: String,
    ward: String
  },
  // 👇 Thêm 'vnpay' vào enum nếu dùng VNPay
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'bank_transfer', 'momo', 'zalopay', 'vnpay'], 
    default: 'cod' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
 orderStatus: { 
  type: String, 
  enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'completed'], 
  default: 'pending' 
},
  notes: String,
  couponCode: String,
  discountAmount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  receivedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  // 👇 Hai trường mới bổ sung
  transactionNo: String,   // Mã giao dịch từ VNPay
  paidAt: Date,            // Thời gian thanh toán
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);