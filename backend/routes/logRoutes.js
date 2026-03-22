const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getLogs, getLogById } = require('../controllers/logController');

// Tất cả route yêu cầu admin
router.use(protect, authorize('admin'));

router.get('/', getLogs);
router.get('/:id', getLogById);

module.exports = router;