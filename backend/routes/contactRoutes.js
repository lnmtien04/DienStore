const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');

// Public route
router.post('/', createContact);

// Routes yêu cầu đăng nhập
router.use(protect);

// Các route GET cho phép cả admin và staff
router.get('/', authorize('admin', 'staff'), getContacts);
router.get('/:id', authorize('admin', 'staff'), getContactById);

// Các route thay đổi dữ liệu chỉ admin
router.put('/:id', authorize('admin'), updateContact);
router.delete('/:id', authorize('admin'), deleteContact);

module.exports = router;