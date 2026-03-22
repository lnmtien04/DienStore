const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  taxCode: String,
  address: String,
  phone: String,
  email: String,
  contactPerson: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);