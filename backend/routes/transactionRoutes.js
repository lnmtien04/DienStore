const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getTransactions } = require('../controllers/transactionController');

router.use(protect, authorize('admin'));

router.get('/', getTransactions);

module.exports = router;