const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['support', 'complaint', 'warranty', 'other'], default: 'support' },
  status: { type: String, enum: ['new', 'processing', 'resolved', 'closed'], default: 'new' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'account' }, // nhân viên xử lý
  notes: [
    {
      content: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  resolvedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);