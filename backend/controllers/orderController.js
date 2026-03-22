const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const Account = require('../models/account'); // sửa thành chữ thường
const { generateOrderNumber } = require('../utils/generate');
const Cart = require('../models/cart');

// ==================== GET ORDERS ====================
const getOrders = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (!req.user.roles?.includes('admin')) {
      query.user = req.user._id;
    }

    if (status) query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'fullName email phoneNumber')
      .populate('createdBy', 'fullName')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('🔥 getOrders error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== GET ORDER BY ID ====================
const getOrderById = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phoneNumber')
      .populate('items.product')
      .populate('createdBy', 'fullName');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.user && order.user._id.equals(req.user._id);
    const isAdmin = req.user.roles?.includes('admin');

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('🔥 getOrderById error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CREATE ORDER ====================
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { userId, items, shippingAddress, paymentMethod, notes } = req.body;
    console.log('📦 Bắt đầu tạo đơn hàng với items:', items);
    console.log('req.user._id:', req.user._id);
    console.log('req.user.roles:', req.user.roles);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng' });
    }

    let finalUserId;
    if (req.user.roles?.includes('admin')) {
      if (!userId) return res.status(400).json({ message: 'Thiếu userId' });
      finalUserId = userId;
      console.log('Admin tạo đơn, finalUserId =', finalUserId);
    } else {
      finalUserId = req.user._id;
      console.log('User thường tạo đơn, finalUserId =', finalUserId);
    }

    const user = await Account.findById(finalUserId);
    if (!user) return res.status(400).json({ message: 'Khách hàng không tồn tại' });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
      }

      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: `Sản phẩm ${item.product} không tồn tại` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm ${product.name} không đủ số lượng (còn ${product.stock})` });
      }

      if (product.warranty && !mongoose.Types.ObjectId.isValid(product.warranty)) {
        console.log(`⚠️ Warranty của sản phẩm "${product.name}" không hợp lệ, set null`);
        product.warranty = null;
        await product.save();
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || null
      });

      totalAmount += product.price * item.quantity;
    }

    const orderNumber = await generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      user: finalUserId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      notes,
      createdBy: req.user._id,
    });

    try { await Cart.findOneAndDelete({ user: finalUserId }); } catch (err) { console.error('Lỗi xóa giỏ:', err); }

    res.status(201).json(order);
  } catch (error) {
    console.error('🔥 Lỗi createOrder:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
});

const confirmReceived = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

    console.log('confirmReceived - order before:', order.orderStatus, order.receivedAt);

    const isOwner = order.user && order.user.equals(req.user._id);
    const isAdmin = req.user.roles?.includes('admin');
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ message: 'Chỉ có thể xác nhận khi đơn hàng đã giao' });
    }

    order.receivedAt = new Date();
    order.orderStatus = 'completed';
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
    }
    await order.save();
    console.log('confirmReceived - order after:', order.orderStatus, order.receivedAt);
    res.json(order);
  } catch (error) {
    console.error('🔥 confirmReceived error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CANCEL ORDER ====================
const cancelOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

    const isOwner = order.user && order.user.equals(req.user._id);
    const isAdmin = req.user.roles?.includes('admin');
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Không có quyền hủy' });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' });
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('🔥 cancelOrder error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== UPDATE STATUS (ADMIN) ====================
const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const now = new Date();
    if (status === 'shipping' && !order.shippedAt) order.shippedAt = now;
    if (status === 'delivered' && !order.deliveredAt) order.deliveredAt = now;
    if (status === 'cancelled' && !order.cancelledAt) order.cancelledAt = now;
    order.orderStatus = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('🔥 updateOrderStatus error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== DELETE ORDER (ADMIN) ====================
const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } catch (error) {
    console.error('🔥 deleteOrder error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== UPDATE ORDER (ADMIN) ====================
const updateOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.body.shippingAddress) order.shippingAddress = req.body.shippingAddress;
    if (req.body.notes !== undefined) order.notes = req.body.notes;
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    console.error('🔥 updateOrder error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== GET ORDER COUNTS ====================
const getOrderCounts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = req.user.roles?.includes('admin');

  const matchCondition = isAdmin ? {} : { user: userId };

  const counts = await Order.aggregate([
    { $match: matchCondition },
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
  ]);

  const result = {
    pending: 0,
    confirmed: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
  };
  counts.forEach(item => {
    result[item._id] = item.count;
  });

  res.json(result);
});

// ==================== GET ORDER HISTORY ====================
const getOrderHistory = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, search, fromDate, toDate } = req.query;
    const query = {
      user: req.user._id,
      orderStatus: 'completed',
    };

    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'fullName email')
      .populate('items.product')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('🔥 getOrderHistory error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== GET NEED REVIEW COUNT ====================
const getNeedReviewCount = asyncHandler(async (req, res) => {
  console.log('🔍 [getNeedReviewCount] bắt đầu, user:', req.user?._id);
  try {
    const userId = req.user._id;
    if (!userId) {
      console.error('❌ [getNeedReviewCount] Không tìm thấy userId');
      return res.status(400).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    // Lấy tất cả đơn hàng đã giao của user
    const orders = await Order.find({ 
      user: userId, 
      orderStatus: 'delivered' 
    }).lean();
    
    console.log(`📦 [getNeedReviewCount] Tìm thấy ${orders.length} đơn hàng delivered`);

    let needReviewCount = 0;
    for (const order of orders) {
      console.log(`  - Đơn ${order._id}: có ${order.items?.length || 0} sản phẩm`);
      for (const item of order.items || []) {
        // Kiểm tra reviewed (nếu undefined thì coi như chưa review)
        const isReviewed = item.reviewed === true;
        console.log(`    • Sản phẩm ${item.name}: reviewed = ${item.reviewed} → ${isReviewed ? 'đã đánh giá' : 'cần đánh giá'}`);
        if (!isReviewed) {
          needReviewCount++;
        }
      }
    }

    console.log(`✅ [getNeedReviewCount] Kết quả: ${needReviewCount} sản phẩm cần đánh giá`);
    res.json({ count: needReviewCount });
  } catch (error) {
    console.error('🔥🔥🔥 [getNeedReviewCount] Lỗi chi tiết:', error);
    // Trả về lỗi chi tiết để client thấy
    res.status(500).json({ 
      message: 'Lỗi server khi đếm số cần đánh giá', 
      error: error.message,
      stack: error.stack 
    });
  }
});

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  confirmReceived,
  cancelOrder,
  updateOrderStatus,
  deleteOrder,
  updateOrder,
  getOrderHistory,
  getOrderCounts,
  getNeedReviewCount, // export hàm mới
};