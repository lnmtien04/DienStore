const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const upload = require('../middleware/uploadMiddleware');
const { optionalAuth, protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Công khai (có thể đăng nhập hoặc không)
router.get('/product/:productId', commentController.getCommentsByProduct);
router.post('/', optionalAuth, upload.array('images', 5), commentController.createComment);
router.get('/:commentId/replies', commentController.getReplies);
router.post('/:commentId/react', protect, commentController.reactToComment); // chỉ người dùng mới được like

// Admin và staff có thể xem danh sách bình luận
router.get('/admin', protect, authorize('admin', 'staff'), commentController.getAllCommentsAdmin);
router.get('/admin/:id', protect, authorize('admin', 'staff'), commentController.getCommentById);

// Các thao tác thay đổi chỉ admin
router.put('/admin/:id/toggle', protect, authorize('admin'), commentController.toggleCommentStatus);
router.post('/admin/:id/reply', protect, authorize('admin'), commentController.replyToComment);
router.delete('/admin/:id', protect, authorize('admin'), commentController.deleteComment);
router.get('/admin/export', protect, authorize('admin'), commentController.exportCommentsCSV);

module.exports = router;