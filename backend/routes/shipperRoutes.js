const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getShippers,
  getShipperById,
  createShipper,
  updateShipper,
  deleteShipper,
} = require('../controllers/shipperController');

// Public routes
router.get('/', getShippers);
router.get('/:id', getShipperById);

// Admin routes
router.post('/', protect, authorize('admin'), createShipper);
router.put('/:id', protect, authorize('admin'), updateShipper); // <-- cần dòng này
router.delete('/:id', protect, authorize('admin'), deleteShipper);

module.exports = router;