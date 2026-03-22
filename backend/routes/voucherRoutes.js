const express = require('express');
const router = express.Router();
const { getAvailableVouchers, checkVoucher } = require('../controllers/voucherController');

router.get('/available', getAvailableVouchers);
router.post('/check', checkVoucher);

module.exports = router;