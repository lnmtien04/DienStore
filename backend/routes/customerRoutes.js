const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
} = require('../controllers/customerController');

// Các route GET cho phép cả admin và staff
router.get('/', protect, authorize('admin', 'staff'), getCustomers);
router.get('/:id', protect, authorize('admin', 'staff'), getCustomerById);

// Các route thay đổi dữ liệu chỉ admin
router.put('/:id', protect, authorize('admin'), updateCustomer);
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleCustomerStatus);
router.delete('/:id', protect, authorize('admin'), deleteCustomer);

module.exports = router;