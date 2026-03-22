const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getPosts,
  getPostBySlug,
  createPost,
    getPostById, 
  updatePost,
  deletePost,
} = require('../controllers/postController');

// Public routes
router.get('/', getPosts);
router.get('/:slug', getPostBySlug);
router.get('/admin/:id', protect, authorize('admin'), getPostById);
// Admin routes
router.post('/', protect, authorize('admin'), upload.single('featuredImage'), createPost);
router.put('/:id', protect, authorize('admin'), upload.single('featuredImage'), updatePost);
router.delete('/:id', protect, authorize('admin'), deletePost);

module.exports = router;