const asyncHandler = require('express-async-handler');
const Cart = require('../models/cart');
const Product = require('../models/product');

// @desc    Lấy giỏ hàng của user hiện tại
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price images stock');
  if (!cart) {
    // Nếu chưa có giỏ, tạo mới (có thể trả về giỏ rỗng)
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  res.json(cart);
});

// @desc    Thêm sản phẩm vào giỏ
// @route   POST /api/cart/add
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity < 1) {
    res.status(400);
    throw new Error('Dữ liệu không hợp lệ');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Sản phẩm không tồn tại');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Kiểm tra sản phẩm đã có trong giỏ chưa
  const existingItem = cart.items.find(item => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  cart.updatedAt = Date.now();
  await cart.save();

  // Populate để trả về thông tin đầy đủ
  await cart.populate('items.product', 'name price images stock');
  res.json(cart);
});

// @desc    Cập nhật số lượng sản phẩm trong giỏ
// @route   PUT /api/cart/update
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity < 1) {
    res.status(400);
    throw new Error('Dữ liệu không hợp lệ');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tồn tại');
  }

  const item = cart.items.find(item => item.product.toString() === productId);
  if (!item) {
    res.status(404);
    throw new Error('Sản phẩm không có trong giỏ');
  }

  item.quantity = quantity;
  cart.updatedAt = Date.now();
  await cart.save();

  await cart.populate('items.product', 'name price images stock');
  res.json(cart);
});

// @desc    Xóa sản phẩm khỏi giỏ
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tồn tại');
  }

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  cart.updatedAt = Date.now();
  await cart.save();

  await cart.populate('items.product', 'name price images stock');
  res.json(cart);
});

// @desc    Xóa toàn bộ giỏ hàng (sau khi đặt hàng)
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
  }
  res.json({ message: 'Đã xóa giỏ hàng' });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};