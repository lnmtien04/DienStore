const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'account',  // Phải đúng tên model của user (có thể là 'User' hoặc 'account')
  default: null,
},
  userName: { type: String, required: true }, // lưu tên hiển thị (của user hoặc guest)
  content: { type: String, required: true },
  images: { type: [String], default: [] },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  isApproved: { type: Boolean, default: true },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  replyCount: { type: Number, default: 0 },
  reactions: { like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'account' }] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', commentSchema);