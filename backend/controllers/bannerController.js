const asyncHandler = require('express-async-handler');
const Banner = require('../models/banner');
const fs = require('fs');
const path = require('path');

// @desc    Lấy danh sách banner (có thể lọc theo position)
// @route   GET /api/banners?position=home
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
  const { position } = req.query;
  const filter = { isActive: true };
  if (position) filter.position = position;

  const banners = await Banner.find(filter).sort('order');
  res.json(banners);
});

// @desc    Lấy chi tiết banner
// @route   GET /api/banners/:id
// @access  Public
const getBannerById = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error('Banner không tồn tại');
  }
  res.json(banner);
});

// @desc    Tạo banner mới
// @route   POST /api/banners
// @access  Admin
const createBanner = asyncHandler(async (req, res) => {
  const { title, link, position, order } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('Vui lòng upload ảnh');
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  const banner = await Banner.create({
    title,
    image: imageUrl,
    link,
    position,
    order: order || 0,
  });

  res.status(201).json(banner);
});

// @desc    Cập nhật banner
// @route   PUT /api/banners/:id
// @access  Admin
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error('Banner không tồn tại');
  }

  // Nếu có upload ảnh mới, xóa ảnh cũ (nếu cần)
  if (req.file) {
    // Xóa file cũ (có thể dùng fs.unlink)
    const oldImagePath = path.join(__dirname, '..', banner.image.replace(`${req.protocol}://${req.get('host')}/uploads/`, 'uploads/'));
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
    banner.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  banner.title = req.body.title || banner.title;
  banner.link = req.body.link || banner.link;
  banner.position = req.body.position || banner.position;
  banner.order = req.body.order !== undefined ? req.body.order : banner.order;
  banner.isActive = req.body.isActive !== undefined ? req.body.isActive : banner.isActive;

  const updated = await banner.save();
  res.json(updated);
});

// @desc    Xóa banner
// @route   DELETE /api/banners/:id
// @access  Admin
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error('Banner không tồn tại');
  }

  // Xóa file ảnh
  const imagePath = path.join(__dirname, '..', banner.image.replace(`${req.protocol}://${req.get('host')}/uploads/`, 'uploads/'));
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  await banner.deleteOne();
  res.json({ message: 'Xóa banner thành công' });
});

module.exports = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};