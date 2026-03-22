const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductBySlug,
  exportProducts,
  importProducts
} = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getProducts); // PHẢI ĐẶT TRƯỚC ROUTE /:id

// Export route (đặt trước /:id để tránh xung đột)
router.get('/export', protect, authorize('admin'), exportProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById); // ROUTE ĐỘNG ĐẶT CUỐI CÙNG

// Admin routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Import route
router.post('/import', protect, authorize('admin'), upload.single('file'), importProducts);

module.exports = router;