const asyncHandler = require('express-async-handler');
const Supplier = require('../models/supplier');
const slugify = require('slugify');

// @desc    Lấy tất cả nhà cung cấp
// @route   GET /api/suppliers
// @access  Admin
const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find().sort('name');
  res.json(suppliers);
});

module.exports = { getSuppliers };
// @desc    Lấy nhà cung cấp theo ID
// @route   GET /api/suppliers/:id
// @access  Admin
const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (supplier) {
    res.json(supplier);
  } else {
    res.status(404);
    throw new Error('Supplier not found');
  }
});

// @desc    Tạo nhà cung cấp mới
// @route   POST /api/suppliers
// @access  Admin
const createSupplier = asyncHandler(async (req, res) => {
  const { name, description, logo, website, phone, email, address, taxCode, contactPerson } = req.body;
  const slug = slugify(name, { lower: true });

  const exists = await Supplier.findOne({ slug });
  if (exists) {
    res.status(400);
    throw new Error('Supplier already exists');
  }

  const supplier = await Supplier.create({
    name,
    slug,
    description,
    logo,
    website,
    phone,
    email,
    address,
    taxCode,
    contactPerson,
  });
  res.status(201).json(supplier);
});

// @desc    Cập nhật nhà cung cấp
// @route   PUT /api/suppliers/:id
// @access  Admin
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404);
    throw new Error('Supplier not found');
  }

  if (req.body.name && req.body.name !== supplier.name) {
    supplier.slug = slugify(req.body.name, { lower: true });
  }
  supplier.name = req.body.name || supplier.name;
  supplier.description = req.body.description || supplier.description;
  supplier.logo = req.body.logo || supplier.logo;
  supplier.website = req.body.website || supplier.website;
  supplier.phone = req.body.phone || supplier.phone;
  supplier.email = req.body.email || supplier.email;
  supplier.address = req.body.address || supplier.address;
  supplier.taxCode = req.body.taxCode || supplier.taxCode;
  supplier.contactPerson = req.body.contactPerson || supplier.contactPerson;
  supplier.isActive = req.body.isActive !== undefined ? req.body.isActive : supplier.isActive;

  const updated = await supplier.save();
  res.json(updated);
});

// @desc    Xóa nhà cung cấp
// @route   DELETE /api/suppliers/:id
// @access  Admin
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404);
    throw new Error('Supplier not found');
  }
  await supplier.deleteOne();
  res.json({ message: 'Supplier removed' });
});

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};