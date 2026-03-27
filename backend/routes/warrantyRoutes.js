const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getWarranties,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty,
} = require('../controllers/warrantyController');

// Các route GET cho phép cả admin và staff
router.get('/', protect, authorize('admin', 'staff'), getWarranties);
router.get('/:id', protect, authorize('admin', 'staff'), getWarrantyById);

// Các route thay đổi dữ liệu chỉ admin
router.post('/', protect, authorize('admin'), createWarranty);
router.put('/:id', protect, authorize('admin'), updateWarranty);
router.delete('/:id', protect, authorize('admin'), deleteWarranty);

module.exports = router;