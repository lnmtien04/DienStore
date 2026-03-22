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

router.use(protect, authorize('admin'));

router.route('/')
  .get(getRoles)
  .post(createRole);

router.route('/:id')
  .get(getRoleById)
  .put(updateRole)
  .delete(deleteRole);

module.exports = router;