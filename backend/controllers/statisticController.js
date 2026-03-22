const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');
const Account = require('../models/account');

// @desc    Lấy doanh thu theo ngày trong khoảng thời gian
// @route   GET /api/statistics/revenue
// @access  Private/Admin
const getRevenueStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  // Chỉ lấy đơn hàng đã giao (delivered)
  match.orderStatus = 'delivered';

  let groupId;
  switch (groupBy) {
    case 'day':
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      break;
    case 'month':
      groupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      break;
    case 'year':
      groupId = { $dateToString: { format: '%Y', date: '$createdAt' } };
      break;
    default:
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }

  const revenue = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupId,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(revenue);
});

// @desc    Lấy top sản phẩm bán chạy
// @route   GET /api/statistics/top-products
// @access  Private/Admin
const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10, startDate, endDate } = req.query;
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  match.orderStatus = 'delivered';

  const topProducts = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: parseInt(limit) }
  ]);
  res.json(topProducts);
});

// @desc    Lấy tổng quan dashboard
// @route   GET /api/statistics/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    todayOrders,
    todayRevenue,
    ordersByStatus
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { orderStatus: 'delivered' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Product.countDocuments(),
    Account.countDocuments({ roles: 'customer' }),
    Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    Order.aggregate([
      { $match: { orderStatus: 'delivered', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }])
  ]);

  res.json({
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalProducts,
    totalCustomers,
    todayOrders,
    todayRevenue: todayRevenue[0]?.total || 0,
    ordersByStatus
  });
});

module.exports = {
  getRevenueStatistics,
  getTopProducts,
  getDashboardStats
};