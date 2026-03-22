const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const upload = require('../middleware/uploadMiddleware');
const { optionalAuth, protect, admin } = require('../middleware/authMiddleware');

// Công khai (có thể đăng nhập hoặc không)
router.get('/product/:productId', commentController.getCommentsByProduct);
router.post('/', optionalAuth, upload.array('images', 5), commentController.createComment);
router.get('/:commentId/replies', commentController.getReplies);
router.post('/:commentId/react', protect, commentController.reactToComment); // chỉ người dùng mới được like

// Admin routes (yêu cầu đăng nhập và role admin)
// Admin routes
router.get('/admin', protect, admin, commentController.getAllCommentsAdmin);
router.get('/admin/:id', protect, admin, commentController.getCommentById);
router.put('/admin/:id/toggle', protect, admin, commentController.toggleCommentStatus);
router.post('/admin/:id/reply', protect, admin, commentController.replyToComment);
router.delete('/admin/:id', protect, admin, commentController.deleteComment);
router.get('/admin/export', protect, admin, commentController.exportCommentsCSV);

module.exports = router;