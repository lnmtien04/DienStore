const asyncHandler = require('express-async-handler');
const Warranty = require('../models/warranty');

// @desc    Lấy tất cả chính sách bảo hành
// @route   GET /api/warranties
// @access  Private/Admin
const getWarranties = asyncHandler(async (req, res) => {
  const warranties = await Warranty.find().sort('-createdAt');
  res.json(warranties);
});

// @desc    Lấy bảo hành theo ID
// @route   GET /api/warranties/:id
// @access  Private/Admin
const getWarrantyById = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findById(req.params.id);
  if (warranty) res.json(warranty);
  else {
    res.status(404);
    throw new Error('Warranty not found');
  }
});

// @desc    Tạo bảo hành mới
// @route   POST /api/warranties
// @access  Private/Admin
const createWarranty = asyncHandler(async (req, res) => {
  const { name, duration, description, warrantyType, applicableType, applicableIds, isDefault, isActive } = req.body;

  // Kiểm tra tên trùng (tùy chọn)
  const existing = await Warranty.findOne({ name });
  if (existing) {
    res.status(400);
    throw new Error('Warranty with this name already exists');
  }

  // Nếu đặt làm mặc định, cần bỏ mặc định của các policy khác
  if (isDefault) {
    await Warranty.updateMany({}, { isDefault: false });
  }

  const warranty = await Warranty.create({
    name,
    duration,
    description,
    warrantyType,
    applicableType,
    applicableIds: applicableIds || [],
    isDefault: isDefault || false,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json(warranty);
});

// @desc    Cập nhật bảo hành
// @route   PUT /api/warranties/:id
// @access  Private/Admin
const updateWarranty = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findById(req.params.id);
  if (!warranty) {
    res.status(404);
    throw new Error('Warranty not found');
  }

  const { name, duration, description, warrantyType, applicableType, applicableIds, isDefault, isActive } = req.body;

  if (name && name !== warranty.name) {
    const existing = await Warranty.findOne({ name, _id: { $ne: warranty._id } });
    if (existing) {
      res.status(400);
      throw new Error('Warranty name already exists');
    }
    warranty.name = name;
  }

  warranty.duration = duration || warranty.duration;
  warranty.description = description !== undefined ? description : warranty.description;
  warranty.warrantyType = warrantyType || warranty.warrantyType;
  warranty.applicableType = applicableType || warranty.applicableType;
  warranty.applicableIds = applicableIds || warranty.applicableIds;
  warranty.isActive = isActive !== undefined ? isActive : warranty.isActive;

  // Xử lý isDefault
  if (isDefault && !warranty.isDefault) {
    await Warranty.updateMany({}, { isDefault: false });
    warranty.isDefault = true;
  } else if (!isDefault && warranty.isDefault) {
    warranty.isDefault = false;
  }

  const updated = await warranty.save();
  res.json(updated);
});

// @desc    Xóa bảo hành
// @route   DELETE /api/warranties/:id
// @access  Private/Admin
const deleteWarranty = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findById(req.params.id);
  if (!warranty) {
    res.status(404);
    throw new Error('Warranty not found');
  }
  await warranty.deleteOne();
  res.json({ message: 'Warranty removed' });
});

module.exports = {
  getWarranties,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty,
};