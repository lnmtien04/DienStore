const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require('../controllers/roleController');

// Cho phép staff xem danh sách và chi tiết
router.get('/', protect, authorize('admin', 'staff'), getRoles);
router.get('/:id', protect, authorize('admin', 'staff'), getRoleById);

// Chỉ admin mới được tạo, sửa, xóa
router.post('/', protect, authorize('admin'), createRole);
router.put('/:id', protect, authorize('admin'), updateRole);
router.delete('/:id', protect, authorize('admin'), deleteRole);

module.exports = router;