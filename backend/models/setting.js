// models/setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  // ---- Cài đặt chung ----
  systemName: { type: String, default: '' },          // tên hệ thống (có thể trùng storeName)
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
  dateFormat: { type: String, default: 'dd/mm/yyyy' },
  currency: { type: String, default: 'VND' },
  itemsPerPage: { type: Number, default: 20 },
  maintenanceMode: { type: Boolean, default: false },

  // ---- Thông tin cửa hàng ----
  storeName: { type: String, default: '' },
  storeEmail: { type: String, default: '' },
  storePhone: { type: String, default: '' },
  hotline: { type: String, default: '' },
  storeAddress: { type: String, default: '' },
  workingHours: { type: String, default: '8:00 - 17:00' },
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  taxCode: { type: String, default: '' },
  website: { type: String, default: '' },

  // ---- Thuế ----
  taxRate: { type: Number, default: 0 },               // VAT %

  // ---- Thanh toán ----
  paymentMethods: {
    cod: { type: Boolean, default: true },
    bankTransfer: { type: Boolean, default: false },
    momo: { type: Boolean, default: false },
    zalopay: { type: Boolean, default: false },
  },
  bankAccount: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
  },
  paymentGatewayApiKey: { type: String, default: '' }, // nếu có

  // ---- Vận chuyển ----
  shippingSettings: {
    defaultShippingFee: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    estimatedDeliveryDays: { type: String, default: '3-5 ngày' },
  },

  // ---- Email (SMTP) ----
  smtp: {
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    fromEmail: { type: String, default: '' },          // email gửi đi
  },

  // ---- Chính sách ----
  warrantyPolicy: { type: String, default: '' },
  returnPolicy: { type: String, default: '' },

  // ---- Sao lưu (chỉ để hiển thị thông tin, không lưu file) ----
  backupSettings: {
    autoBackup: { type: Boolean, default: false },
    backupFrequency: { type: String, default: 'daily' }, // daily, weekly, monthly
  },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);