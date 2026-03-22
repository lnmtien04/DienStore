const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');
const Account = require('../models/account');

// @desc    Lấy thống kê dashboard
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // Lấy tổng số đơn hàng
  const totalOrders = await Order.countDocuments();

  // Tính tổng doanh thu (tổng tiền của các đơn đã giao hoặc đã thanh toán? Tạm tính tất cả đơn)
  // Có thể lọc theo trạng thái delivered hoặc paymentStatus paid
  const orders = await Order.find({ orderStatus: 'delivered' }); // hoặc paymentStatus: 'paid'
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Tổng số sản phẩm
  const totalProducts = await Product.countDocuments();

  // Tổng số khách hàng (tài khoản có role customer)
  const totalCustomers = await Account.countDocuments({ roles: 'customer' });

  // Lấy 5 đơn hàng gần nhất (để hiển thị trong hoạt động gần đây)
  const recentOrders = await Order.find()
    .populate('user', 'fullName')
    .sort('-createdAt')
    .limit(5)
    .select('orderNumber totalAmount orderStatus createdAt user');

  res.json({
    totalOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    recentOrders
  });
});

module.exports = { getDashboardStats };