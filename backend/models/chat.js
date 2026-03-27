const express = require('express');
const router = express.Router();
const Message = require('./Message');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Lấy tin nhắn của một conversation (dành cho admin hoặc user)
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo conversation mới (khi user bắt đầu chat)
router.post('/conversation', protect, async (req, res) => {
  // Tạo conversationId duy nhất (có thể dùng userId + adminId, nhưng đơn giản là random)
  const conversationId = new mongoose.Types.ObjectId().toString();
  // Lưu conversation vào DB nếu cần (có model Conversation riêng)
  res.json({ conversationId });
});

module.exports = router;