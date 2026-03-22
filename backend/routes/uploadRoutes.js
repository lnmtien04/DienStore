const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file' });
  // req.file.path là URL Cloudinary
  res.json({ url: req.file.path });
});

module.exports = router;