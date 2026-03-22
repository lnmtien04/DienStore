const asyncHandler = require('express-async-handler');
const Review = require('../models/review');
const Order = require('../models/order');
const Product = require('../models/product');

// @desc    Tạo hoặc cập nhật đánh giá
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;
  const userId = req.user._id;
  const files = req.files; // từ multer

  // Kiểm tra dữ liệu đầu vào
  if (!productId || !orderId || !rating) {
    return res.status(400).json({ message: 'Thiếu thông tin đánh giá' });
  }

  // Tìm đơn hàng
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
  }

  // Kiểm tra quyền sở hữu
  if (order.user.toString() !== userId.toString()) {
    return res.status(403).json({ message: 'Bạn không có quyền đánh giá đơn hàng này' });
  }

  // Kiểm tra trạng thái đơn hàng: phải là 'delivered' và đã xác nhận nhận hàng
  if (order.orderStatus !== 'delivered' || !order.receivedAt) {
    return res.status(400).json({ message: 'Chỉ có thể đánh giá khi đơn hàng đã giao và bạn đã xác nhận nhận hàng' });
  }

  // Tìm item trong đơn hàng
  const itemIndex = order.items.findIndex(item => item.product.toString() === productId);
  if (itemIndex === -1) {
    return res.status(400).json({ message: 'Sản phẩm không có trong đơn hàng' });
  }

  // Tìm review cũ (nếu có)
  let existingReview = await Review.findOne({ user: userId, product: productId, order: orderId });

  // Xử lý đường dẫn ảnh mới (nếu có upload)
  let imageUrls = [];
  if (files && files.length > 0) {
    imageUrls = files.map(file => `/uploads/${file.filename}`);
  } else {
    // Nếu không upload ảnh mới và đã có review cũ, giữ lại ảnh cũ
    if (existingReview) {
      imageUrls = existingReview.images;
    }
  }

  let review;
  if (existingReview) {
    // Cập nhật review cũ
    existingReview.rating = Number(rating);
    existingReview.comment = comment || '';
    existingReview.images = imageUrls;
    await existingReview.save();
    review = existingReview;
  } else {
    // Tạo review mới
    review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating: Number(rating),
      comment: comment || '',
      images: imageUrls,
    });
    // Đánh dấu item trong order đã được review (chỉ khi tạo mới)
    order.items[itemIndex].reviewed = true;
    await order.save();
  }

  // Cập nhật rating trung bình và số lượt đánh giá của sản phẩm (dựa trên tất cả review của sản phẩm đó)
  const product = await Product.findById(productId);
  const allReviews = await Review.find({ product: productId });
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = totalRating / allReviews.length;
  product.reviewCount = allReviews.length;
  await product.save();

  res.status(201).json(review);
});

module.exports = { createReview };