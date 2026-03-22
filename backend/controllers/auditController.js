const asyncHandler = require('express-async-handler');
const Audit = require('../models/audit');
const Product = require('../models/product');
const Transaction = require('../models/transaction');

// Helper sinh mã kiểm kê tự động
const generateAuditCode = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const prefix = `KK${year}${month}${day}`;
  const lastAudit = await Audit.findOne({ code: new RegExp(`^${prefix}`) }).sort('-code');
  let seq = 1;
  if (lastAudit) {
    const lastSeq = parseInt(lastAudit.code.slice(-3)) || 0;
    seq = lastSeq + 1;
  }
  return `${prefix}${seq.toString().padStart(3, '0')}`;
};

// @desc    Lấy danh sách kiểm kê
// @route   GET /api/audits
// @access  Private/Admin
const getAudits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, fromDate, toDate } = req.query;
  const query = {};
  if (status) query.status = status;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const audits = await Audit.find(query)
    .populate('createdBy', 'fullName')
    .populate('completedBy', 'fullName')
    .populate('items.product', 'name sku')
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Audit.countDocuments(query);

  res.json({
    audits,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

// @desc    Lấy chi tiết kiểm kê
// @route   GET /api/audits/:id
// @access  Private/Admin
const getAuditById = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id)
    .populate('createdBy', 'fullName')
    .populate('completedBy', 'fullName')
    .populate('items.product', 'name sku');
  if (!audit) {
    res.status(404);
    throw new Error('Không tìm thấy phiếu kiểm kê');
  }
  res.json(audit);
});

// @desc    Tạo phiếu kiểm kê mới (draft)
// @route   POST /api/audits
// @access  Private/Admin
const createAudit = asyncHandler(async (req, res) => {
  const { warehouse, note, items } = req.body;
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Danh sách sản phẩm không được để trống');
  }

  // Tính toán chênh lệch cho từng item
  let totalDifference = 0;
  const auditItems = [];
  for (let item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(400);
      throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
    }
    const systemStock = product.stock;
    const actualStock = item.actualStock;
    const difference = actualStock - systemStock;
    totalDifference += difference;

    auditItems.push({
      product: product._id,
      systemStock,
      actualStock,
      difference,
      note: item.note || '',
    });
  }

  const code = await generateAuditCode();

  const audit = await Audit.create({
    code,
    warehouse: warehouse || 'main',
    status: 'draft',
    items: auditItems,
    totalDifference,
    note,
    createdBy: req.user._id,
  });

  res.status(201).json(audit);
});

// @desc    Cập nhật phiếu kiểm kê (chỉ khi draft)
// @route   PUT /api/audits/:id
// @access  Private/Admin
const updateAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id);
  if (!audit) {
    res.status(404);
    throw new Error('Không tìm thấy phiếu kiểm kê');
  }
  if (audit.status !== 'draft') {
    res.status(400);
    throw new Error('Chỉ có thể sửa phiếu ở trạng thái nháp');
  }

  const { warehouse, note, items } = req.body;
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Danh sách sản phẩm không được để trống');
  }

  let totalDifference = 0;
  const auditItems = [];
  for (let item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(400);
      throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
    }
    const systemStock = product.stock;
    const actualStock = item.actualStock;
    const difference = actualStock - systemStock;
    totalDifference += difference;

    auditItems.push({
      product: product._id,
      systemStock,
      actualStock,
      difference,
      note: item.note || '',
    });
  }

  audit.warehouse = warehouse || audit.warehouse;
  audit.note = note;
  audit.items = auditItems;
  audit.totalDifference = totalDifference;

  await audit.save();
  res.json(audit);
});

// @desc    Hoàn thành kiểm kê (chỉ khi draft)
// @route   POST /api/audits/:id/complete
// @access  Private/Admin
const completeAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id);
  if (!audit) {
    res.status(404);
    throw new Error('Không tìm thấy phiếu kiểm kê');
  }
  if (audit.status !== 'draft') {
    res.status(400);
    throw new Error('Chỉ có thể hoàn thành phiếu ở trạng thái nháp');
  }

  // Cập nhật tồn kho và ghi nhận giao dịch cho các sản phẩm có chênh lệch
  for (let item of audit.items) {
    if (item.difference !== 0) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.stock;
        product.stock = item.actualStock; // cập nhật theo thực tế
        await product.save();

        // Ghi nhận giao dịch điều chỉnh
        await Transaction.create({
          product: product._id,
          type: 'adjustment',
          quantity: item.difference,
          stockBefore: previousStock,
          stockAfter: product.stock,
          referenceType: 'audit',
          referenceId: audit.code,
          note: `Kiểm kê ${audit.code}`,
          createdBy: req.user._id,
        });
      }
    }
  }

  audit.status = 'completed';
  audit.completedBy = req.user._id;
  audit.completedAt = new Date();
  await audit.save();

  res.json({ message: 'Hoàn thành kiểm kê', audit });
});

// @desc    Hủy phiếu kiểm kê (chỉ khi draft)
// @route   POST /api/audits/:id/cancel
// @access  Private/Admin
const cancelAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id);
  if (!audit) {
    res.status(404);
    throw new Error('Không tìm thấy phiếu kiểm kê');
  }
  if (audit.status !== 'draft') {
    res.status(400);
    throw new Error('Chỉ có thể hủy phiếu ở trạng thái nháp');
  }

  audit.status = 'cancelled';
  await audit.save();
  res.json({ message: 'Đã hủy phiếu kiểm kê' });
});

module.exports = {
  getAudits,
  getAuditById,
  createAudit,
  updateAudit,
  completeAudit,
  cancelAudit,
};