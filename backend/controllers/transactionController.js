const asyncHandler = require('express-async-handler');
const Transaction = require('../models/transaction');
const Product = require('../models/product');
const Account = require('../models/account');

const getTransactions = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, type, fromDate, toDate, userId, search } = req.query;

    const query = {};

    if (productId) query.product = productId;
    if (type) query.type = type;
    if (userId) query.createdBy = userId;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const products = await Product.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const productIds = products.map(p => p._id);
      query.product = { $in: productIds };
    }

    const transactions = await Transaction.find(query)
      .populate('product', 'name sku')
      .populate('createdBy', 'fullName')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('🔥 Lỗi trong getTransactions:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

module.exports = { getTransactions };