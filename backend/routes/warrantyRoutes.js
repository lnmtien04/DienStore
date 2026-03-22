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

// Tất cả routes đều yêu cầu admin
router.use(protect, authorize('admin'));

router.route('/').get(getWarranties).post(createWarranty);
router.route('/:id').get(getWarrantyById).put(updateWarranty).delete(deleteWarranty);

module.exports = router;