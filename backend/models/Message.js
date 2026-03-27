const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderType' },
  senderType: { type: String, enum: ['User', 'Admin'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);