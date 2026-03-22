const asyncHandler = require('express-async-handler');
const Account = require('../models/account');

// @desc    Lấy tất cả khách hàng (có thể lọc theo role)
// @route   GET /api/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Account.find({ roles: 'customer' }).select('-password');
  res.json(customers);
});

// @desc    Lấy thông tin khách hàng theo ID
// @route   GET /api/customers/:id
// @access  Private/Admin
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Account.findById(req.params.id).select('-password');
  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Cập nhật thông tin khách hàng (admin có thể sửa)
// @route   PUT /api/customers/:id
// @access  Private/Admin
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Account.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Chỉ cho phép sửa một số trường
  customer.fullName = req.body.fullName || customer.fullName;
  customer.email = req.body.email || customer.email;
  customer.phoneNumber = req.body.phoneNumber || customer.phoneNumber;
  customer.address = req.body.address || customer.address;
  customer.isActive = req.body.isActive !== undefined ? req.body.isActive : customer.isActive;
  customer.roles = req.body.roles || customer.roles; // cẩn thận khi sửa role

  const updated = await customer.save();
  const { password, ...rest } = updated.toObject();
  res.json(rest);
});

// @desc    Xóa khách hàng (admin)
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Account.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  await customer.deleteOne();
  res.json({ message: 'Customer removed' });
});

// @desc    Khóa/Mở khóa tài khoản khách hàng
// @route   PATCH /api/customers/:id/toggle-status
// @access  Private/Admin
const toggleCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await Account.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  customer.isActive = !customer.isActive;
  await customer.save();
  res.json({ isActive: customer.isActive, message: `Customer ${customer.isActive ? 'activated' : 'deactivated'}` });
});

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
};