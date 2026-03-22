const asyncHandler = require('express-async-handler');
const Role = require('../models/role');

// @desc    Lấy tất cả roles
// @route   GET /api/roles
// @access  Private/Admin
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort('-createdAt');
  res.json(roles);
});

// @desc    Lấy role theo ID
// @route   GET /api/roles/:id
// @access  Private/Admin
const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (role) res.json(role);
  else {
    res.status(404).json({ message: 'Không tìm thấy chức vụ' });
  }
});

// @desc    Tạo role mới
// @route   POST /api/roles
// @access  Private/Admin
const createRole = asyncHandler(async (req, res) => {
  console.log('Request body:', req.body);
  const { name, description, permissions, isActive } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập tên chức vụ' });
  }

  const trimmedName = name.trim();

  // Kiểm tra trùng tên
  const existingRole = await Role.findOne({ name: trimmedName });
  if (existingRole) {
    console.log('Role already exists:', trimmedName);
    return res.status(400).json({ message: 'Tên chức vụ đã tồn tại' });
  }

  try {
    const role = await Role.create({
      name: trimmedName,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
      isActive: isActive !== undefined ? isActive : true,
    });
    console.log('Role created:', role);
    res.status(201).json(role);
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Tên chức vụ đã tồn tại' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @desc    Cập nhật role
// @route   PUT /api/roles/:id
// @access  Private/Admin
const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    return res.status(404).json({ message: 'Không tìm thấy chức vụ' });
  }

  const { name, description, permissions, isActive } = req.body;

  if (name && name.trim() && name.trim() !== role.name) {
    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Tên chức vụ đã tồn tại' });
    }
    role.name = name.trim();
  }

  role.description = description !== undefined ? description : role.description;
  role.permissions = Array.isArray(permissions) ? permissions : role.permissions;
  role.isActive = isActive !== undefined ? isActive : role.isActive;

  try {
    const updated = await role.save();
    res.json(updated);
  } catch (err) {
    console.error('Error updating role:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Tên chức vụ đã tồn tại' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @desc    Xóa role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    return res.status(404).json({ message: 'Không tìm thấy chức vụ' });
  }
  await role.deleteOne();
  res.json({ message: 'Xóa chức vụ thành công' });
});

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole };