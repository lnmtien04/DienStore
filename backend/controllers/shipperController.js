const asyncHandler = require('express-async-handler');
const Shipper = require('../models/shipper');
const slugify = require('slugify');

// @desc    Lấy tất cả đơn vị vận chuyển
// @route   GET /api/shippers
const getShippers = asyncHandler(async (req, res) => {
  const shippers = await Shipper.find().sort('-createdAt');
  res.json(shippers);
});

// @desc    Lấy đơn vị vận chuyển theo ID
// @route   GET /api/shippers/:id
const getShipperById = asyncHandler(async (req, res) => {
  const shipper = await Shipper.findById(req.params.id);
  if (shipper) {
    res.json(shipper);
  } else {
    res.status(404);
    throw new Error('Shipper not found');
  }
});

// @desc    Tạo đơn vị vận chuyển mới
// @route   POST /api/shippers
const createShipper = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    website, 
    phone, 
    email, 
    logo,
    defaultFee, 
    freeThreshold, 
    estimatedDelivery, 
    coverage, 
    serviceType, 
    priority, 
    status, 
    trackingUrlTemplate, 
    isDefault 
  } = req.body;
  
  const slug = slugify(name, { lower: true });

  const exists = await Shipper.findOne({ slug });
  if (exists) {
    res.status(400);
    throw new Error('Shipper already exists');
  }

  const shipper = await Shipper.create({
    name,
    slug,
    description,
    website,
    phone,
    email,
    logo,
    defaultFee: defaultFee || 0,
    freeThreshold: freeThreshold || 0,
    estimatedDelivery,
    coverage: coverage || 'nationwide',
    serviceType: serviceType || 'standard',
    priority: priority || 0,
    status: status || 'active',
    trackingUrlTemplate,
    isDefault: isDefault || false,
  });

  res.status(201).json(shipper);
});

// @desc    Cập nhật đơn vị vận chuyển
// @route   PUT /api/shippers/:id
const updateShipper = asyncHandler(async (req, res) => {
  const shipper = await Shipper.findById(req.params.id);
  if (!shipper) {
    res.status(404);
    throw new Error('Shipper not found');
  }

  // Cập nhật slug nếu name thay đổi
  if (req.body.name && req.body.name !== shipper.name) {
    shipper.slug = slugify(req.body.name, { lower: true });
  }

  shipper.name = req.body.name || shipper.name;
  shipper.description = req.body.description !== undefined ? req.body.description : shipper.description;
  shipper.website = req.body.website !== undefined ? req.body.website : shipper.website;
  shipper.phone = req.body.phone !== undefined ? req.body.phone : shipper.phone;
  shipper.email = req.body.email !== undefined ? req.body.email : shipper.email;
  shipper.logo = req.body.logo !== undefined ? req.body.logo : shipper.logo;
  shipper.defaultFee = req.body.defaultFee !== undefined ? req.body.defaultFee : shipper.defaultFee;
  shipper.freeThreshold = req.body.freeThreshold !== undefined ? req.body.freeThreshold : shipper.freeThreshold;
  shipper.estimatedDelivery = req.body.estimatedDelivery !== undefined ? req.body.estimatedDelivery : shipper.estimatedDelivery;
  shipper.coverage = req.body.coverage !== undefined ? req.body.coverage : shipper.coverage;
  shipper.serviceType = req.body.serviceType !== undefined ? req.body.serviceType : shipper.serviceType;
  shipper.priority = req.body.priority !== undefined ? req.body.priority : shipper.priority;
  shipper.status = req.body.status !== undefined ? req.body.status : shipper.status;
  shipper.trackingUrlTemplate = req.body.trackingUrlTemplate !== undefined ? req.body.trackingUrlTemplate : shipper.trackingUrlTemplate;
  shipper.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : shipper.isDefault;

  const updated = await shipper.save();
  res.json(updated);
});

// @desc    Xóa đơn vị vận chuyển
// @route   DELETE /api/shippers/:id
const deleteShipper = asyncHandler(async (req, res) => {
  const shipper = await Shipper.findById(req.params.id);
  if (!shipper) {
    res.status(404);
    throw new Error('Shipper not found');
  }
  await shipper.deleteOne();
  res.json({ message: 'Shipper removed' });
});

module.exports = {
  getShippers,
  getShipperById,
  createShipper,
  updateShipper,
  deleteShipper,
};