const mongoose = require('mongoose');

const shipperSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  website: String,
  phone: String,
  email: String,
  logo: String, // URL ảnh logo
  // Các trường mới
  defaultFee: { type: Number, default: 0 }, // phí mặc định
  freeThreshold: { type: Number, default: 0 }, // miễn phí từ đơn hàng >= giá trị này
  estimatedDelivery: String, // thời gian dự kiến, ví dụ "2-3 ngày"
  coverage: { type: String, enum: ['nationwide', 'city', 'district'], default: 'nationwide' }, // khu vực áp dụng
  serviceType: { type: String, enum: ['standard', 'fast', 'express'], default: 'standard' }, // loại dịch vụ
  priority: { type: Number, default: 0 }, // thứ tự ưu tiên (số càng nhỏ càng ưu tiên)
  status: { type: String, enum: ['active', 'suspended', 'discontinued'], default: 'active' }, // trạng thái nâng cao
  // Có thể thêm trackingUrlTemplate nếu cần
  trackingUrlTemplate: String, // ví dụ "https://tracking.shipper.com/{trackingCode}"
  isDefault: { type: Boolean, default: false }, // đơn vị mặc định
}, { timestamps: true });

module.exports = mongoose.model('Shipper', shipperSchema);