const asyncHandler = require('express-async-handler');
const PurchaseOrder = require('../models/purchaseorder');
const Product = require('../models/product');
const Supplier = require('../models/supplier');
const Transaction = require('../models/transaction'); // để ghi lịch sử kho
const Account = require('../models/account');

// Helper sinh mã phiếu tự động (có thể đếm số lượng phiếu trong ngày)
const generateOrderCode = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const prefix = `PN${year}${month}${day}`;
  const lastOrder = await PurchaseOrder.findOne({ code: new RegExp(`^${prefix}`) }).sort('-code');
  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.code.slice(-3)) || 0;
    seq = lastSeq + 1;
  }
  return `${prefix}${seq.toString().padStart(3, '0')}`;
};

// @desc    Lấy danh sách phiếu nhập (có phân trang, lọc)
// @route   GET /api/purchase-orders
// @access  Private/Admin
const getPurchaseOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, supplier, fromDate, toDate } = req.query;
  const query = {};
  if (status) query.status = status;
  if (supplier) query.supplier = supplier;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const orders = await PurchaseOrder.find(query)
    .populate('supplier', 'name')
    .populate('createdBy', 'fullName')
    .populate('approvedBy', 'fullName')
    .populate('cancelledBy', 'fullName')
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await PurchaseOrder.countDocuments(query);

  res.json({
    orders,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

// @desc    Lấy chi tiết phiếu nhập
// @route   GET /api/purchase-orders/:id
// @access  Private/Admin
const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id)
    .populate('supplier', 'name')
    .populate('items.product', 'name sku')
    .populate('createdBy', 'fullName')
    .populate('approvedBy', 'fullName')
    .populate('cancelledBy', 'fullName');
  if (!order) {
    res.status(404);
    throw new Error('Phiếu nhập không tồn tại');
  }
  res.json(order);
});

// @desc    Tạo phiếu nhập mới (draft)
// @route   POST /api/purchase-orders
// @access  Private/Admin
const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplier, orderDate, items, notes } = req.body;
  if (!supplier || !items || items.length === 0) {
    res.status(400);
    throw new Error('Nhà cung cấp và danh sách sản phẩm là bắt buộc');
  }

  // Kiểm tra supplier tồn tại
  const supplierDoc = await Supplier.findById(supplier);
  if (!supplierDoc) {
    res.status(400);
    throw new Error('Nhà cung cấp không tồn tại');
  }

  // Tính tổng tiền và validate sản phẩm
  let totalAmount = 0;
  const itemsWithDetails = [];
  for (let item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(400);
      throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
    }
    const total = item.quantity * item.purchasePrice;
    totalAmount += total;
    itemsWithDetails.push({
      product: product._id,
      sku: product.sku || '',
      productName: product.name,
      currentStock: product.stock,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      total,
    });
  }

  const code = await generateOrderCode();

  const order = await PurchaseOrder.create({
    code,
    supplier,
    supplierName: supplierDoc.name,
    orderDate: orderDate || new Date(),
    items: itemsWithDetails,
    totalAmount,
    notes,
    createdBy: req.user._id,
    status: 'draft',
  });

  res.status(201).json(order);
});

// @desc    Cập nhật phiếu nhập (chỉ khi draft)
// @route   PUT /api/purchase-orders/:id
// @access  Private/Admin
const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Phiếu nhập không tồn tại');
  }
  if (order.status !== 'draft') {
    res.status(400);
    throw new Error('Chỉ có thể sửa phiếu ở trạng thái nháp');
  }

  const { supplier, orderDate, items, notes } = req.body;
  if (!supplier || !items || items.length === 0) {
    res.status(400);
    throw new Error('Nhà cung cấp và danh sách sản phẩm là bắt buộc');
  }

  const supplierDoc = await Supplier.findById(supplier);
  if (!supplierDoc) {
    res.status(400);
    throw new Error('Nhà cung cấp không tồn tại');
  }

  let totalAmount = 0;
  const itemsWithDetails = [];
  for (let item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(400);
      throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
    }
    const total = item.quantity * item.purchasePrice;
    totalAmount += total;
    itemsWithDetails.push({
      product: product._id,
      sku: product.sku || '',
      productName: product.name,
      currentStock: product.stock,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      total,
    });
  }

  order.supplier = supplier;
  order.supplierName = supplierDoc.name;
  order.orderDate = orderDate || new Date();
  order.items = itemsWithDetails;
  order.totalAmount = totalAmount;
  order.notes = notes;

  const updated = await order.save();
  res.json(updated);
});

// @desc    Duyệt phiếu nhập (chuyển từ draft -> approved, cập nhật kho)
// @route   POST /api/purchase-orders/:id/approve
// @access  Private/Admin
const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Phiếu nhập không tồn tại');
  }
  if (order.status !== 'draft') {
    res.status(400);
    throw new Error('Chỉ có thể duyệt phiếu ở trạng thái nháp');
  }

  // Cập nhật tồn kho cho từng sản phẩm và ghi lịch sử
  for (let item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Sản phẩm ${item.productName} không tồn tại`);
    }
    const previousStock = product.stock;
    product.stock += item.quantity; // nhập kho tăng
    await product.save();

    // Ghi nhận giao dịch vào lịch sử kho
    await Transaction.create({
      product: product._id,
      type: 'import',
      quantity: item.quantity,
      stockBefore: previousStock,
      stockAfter: product.stock,
      referenceType: 'purchase',
      referenceId: order.code,
      note: `Nhập từ phiếu ${order.code}`,
      createdBy: req.user._id,
    });
  }

  order.status = 'approved';
  order.approvedBy = req.user._id;
  order.approvedAt = new Date();
  await order.save();

  res.json({ message: 'Phiếu nhập đã được duyệt và cập nhật kho', order });
});
// Hàm sinh mã giao dịch (có thể để trong utils)

// Trong approvePurchaseOrder

// @desc    Hủy phiếu nhập (chỉ khi draft)
// @route   POST /api/purchase-orders/:id/cancel
// @access  Private/Admin
const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Phiếu nhập không tồn tại');
  }
  if (order.status !== 'draft') {
    res.status(400);
    throw new Error('Chỉ có thể hủy phiếu ở trạng thái nháp');
  }

  order.status = 'cancelled';
  order.cancelledBy = req.user._id;
  order.cancelledAt = new Date();
  await order.save();

  res.json({ message: 'Phiếu nhập đã bị hủy', order });
});

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
};