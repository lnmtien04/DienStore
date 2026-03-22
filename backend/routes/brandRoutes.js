const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Admin routes
router.post('/', protect, authorize('admin'), createBrand);
router.put('/:id', protect, authorize('admin'), updateBrand);
router.delete('/:id', protect, authorize('admin'), deleteBrand);

module.exports = router;