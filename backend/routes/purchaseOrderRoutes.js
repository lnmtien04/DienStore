const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
} = require('../controllers/purchaseOrderController');

// Tất cả route đều yêu cầu admin
router.use(protect, authorize('admin'));
router.use(protect);
router.route('/')
  .get(getPurchaseOrders)
  .post(createPurchaseOrder);

router.route('/:id')
  .get(getPurchaseOrderById)
  .put(updatePurchaseOrder);

router.post('/:id/approve', approvePurchaseOrder);
router.post('/:id/cancel', cancelPurchaseOrder);

module.exports = router;