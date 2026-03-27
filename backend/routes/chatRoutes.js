const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Account = require('../models/account');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Lấy lịch sử tin nhắn của một conversation (cho phép cả staff)
router.get('/:conversationId', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Đánh dấu tin nhắn trong conversation đã được đọc bởi admin (chỉ admin)
router.post('/:conversationId/read', protect, authorize('admin'), async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId, readByAdmin: false },
      { $set: { readByAdmin: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Tạo conversation mới (khi user bắt đầu chat) - người dùng thường
router.post('/conversation', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = `user_${userId}_admin`;

    const existing = await Conversation.findOne({ _id: conversationId });
    if (!existing) {
      await Conversation.create({
        _id: conversationId,
        participants: [userId],
        participantModels: ['User']
      });
    }

    res.json({ conversationId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin và staff lấy danh sách conversation
router.get('/admin/conversations', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$content' },
          lastTimestamp: { $first: '$timestamp' },
          unreadCount: { $sum: { $cond: [{ $eq: ['$readByAdmin', false] }, 1, 0] } }
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);

    const userIds = conversations.map(c => {
      const parts = c._id.split('_');
      return parts[1];
    }).filter(id => id);

    const users = await Account.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const result = conversations.map(conv => {
      const userId = conv._id.split('_')[1];
      const user = userId ? userMap.get(userId) : null;
      return {
        _id: conv._id,
        lastMessage: conv.lastMessage,
        lastTimestamp: conv.lastTimestamp,
        unreadCount: conv.unreadCount,
        userInfo: user ? {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar || null
        } : null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;