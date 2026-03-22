const asyncHandler = require('express-async-handler');
const Inventory = require('../models/inventory');
const Product = require('../models/product');

// @desc    Lấy danh sách tồn kho của tất cả sản phẩm
// @route   GET /api/inventory
const getInventory = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('category', 'name')
    .populate('brand', 'name')
    .select('sku name price stock minStock images category brand');
  res.json(products);
});

// @desc    Lấy thống kê tổng quan
// @route   GET /api/inventory/stats
const getStats = asyncHandler(async (req, res) => {
  const products = await Product.find();
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.minStock && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  res.json({ totalProducts, lowStockCount, outOfStockCount, totalInventoryValue });
});

// @desc    Lấy lịch sử nhập/xuất của một sản phẩm
// @route   GET /api/inventory/history/:productId
const getProductHistory = asyncHandler(async (req, res) => {
  const history = await Inventory.find({ product: req.params.productId })
    .populate('createdBy', 'fullName')
    .sort('-createdAt');
  res.json(history);
});

// @desc    Lấy tất cả giao dịch nhập/xuất
// @route   GET /api/inventory/transactions
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Inventory.find()
    .populate('product', 'name sku')
    .populate('createdBy', 'fullName')
    .sort('-createdAt');
  res.json(transactions);
});

// @desc    Nhập kho (tăng số lượng)
// @route   POST /api/inventory/import
const importStock = asyncHandler(async (req, res) => {
  const { productId, quantity, note } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error('Số lượng nhập phải lớn hơn 0');
  }
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Sản phẩm không tồn tại');
  }
  const previousStock = product.stock;
  const newStock = previousStock + quantity;
  product.stock = newStock;
  await product.save();

  const inventory = await Inventory.create({
    product: productId,
    type: 'import',
    quantity,
    previousStock,
    newStock,
    note,
    createdBy: req.user._id,
  });
  res.status(201).json({ message: 'Nhập kho thành công', inventory });
});

// @desc    Xuất kho (giảm số lượng)
// @route   POST /api/inventory/export
const exportStock = asyncHandler(async (req, res) => {
  const { productId, quantity, note, reference } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error('Số lượng xuất phải lớn hơn 0');
  }
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Sản phẩm không tồn tại');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error('Số lượng xuất vượt quá tồn kho');
  }
  const previousStock = product.stock;
  const newStock = previousStock - quantity;
  product.stock = newStock;
  await product.save();

  const inventory = await Inventory.create({
    product: productId,
    type: 'export',
    quantity: -quantity,
    previousStock,
    newStock,
    note,
    reference,
    createdBy: req.user._id,
  });
  res.status(201).json({ message: 'Xuất kho thành công', inventory });
});

// @desc    Điều chỉnh tồn kho (sửa trực tiếp)
// @route   POST /api/inventory/adjust
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, newStock, note } = req.body;
  if (!productId || newStock === undefined || newStock < 0) {
    res.status(400);
    throw new Error('Số lượng tồn mới không hợp lệ');
  }
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Sản phẩm không tồn tại');
  }
  const previousStock = product.stock;
  const quantity = newStock - previousStock;
  product.stock = newStock;
  await product.save();

  const inventory = await Inventory.create({
    product: productId,
    type: 'adjust',
    quantity,
    previousStock,
    newStock,
    note,
    createdBy: req.user._id,
  });
  res.json({ message: 'Điều chỉnh tồn kho thành công', inventory });
});

module.exports = {
  getInventory,
  getStats,
  getProductHistory,
  getTransactions,
  importStock,
  exportStock,
  adjustStock,
};