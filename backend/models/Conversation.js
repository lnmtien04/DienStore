const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantModels'
  }],
  participantModels: { type: [String], enum: ['User', 'Admin'] },
  lastMessage: { type: String },
  lastMessageTimestamp: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);