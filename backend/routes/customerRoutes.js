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

// Tất cả routes đều yêu cầu admin
router.use(protect, authorize('admin'));

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.patch('/:id/toggle-status', toggleCustomerStatus);
router.delete('/:id', deleteCustomer);

module.exports = router;