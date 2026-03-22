const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getInventory,
  getStats,
  getProductHistory,
  getTransactions,
  importStock,
  exportStock,
  adjustStock,
} = require('../controllers/inventoryController');

router.use(protect, authorize('admin'));

router.get('/', getInventory);
router.get('/stats', getStats);                   // <-- thêm
router.get('/transactions', getTransactions);
router.get('/history/:productId', getProductHistory);
router.post('/import', importStock);
router.post('/export', exportStock);
router.post('/adjust', adjustStock);

module.exports = router;