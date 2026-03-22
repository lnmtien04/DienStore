const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const uploadBanner = require('../middleware/uploadBanner'); // ← import middleware riêng
const {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

router.route('/')
  .get(getBanners)
  .post(protect, authorize('admin'), uploadBanner.single('image'), createBanner); // ← dùng uploadBanner

router.route('/:id')
  .get(getBannerById)
  .put(protect, authorize('admin'), uploadBanner.single('image'), updateBanner) // ← dùng uploadBanner
  .delete(protect, authorize('admin'), deleteBanner);

module.exports = router;