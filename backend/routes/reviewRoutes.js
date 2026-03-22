const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createReview } = require('../controllers/reviewController');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.array('images', 5), createReview);

module.exports = router;