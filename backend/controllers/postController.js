const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

// @desc    Lấy danh sách bài viết (public)
// @route   GET /api/posts
// @access  Public
const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, status } = req.query;
  const query = {};

  if (status === 'published') query.status = 'published';
  else if (status === 'draft') query.status = 'draft';
  // Nếu không có status, admin sẽ lấy tất cả, public chỉ lấy published

  if (category) query.category = category;

  const posts = await Post.find(query)
    .populate('category', 'name')
    .populate('author', 'fullName')
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Post.countDocuments(query);

  res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// @desc    Lấy bài viết theo slug
// @route   GET /api/posts/:slug
// @access  Public
const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug })
    .populate('category', 'name slug')
    .populate('author', 'fullName');

  if (!post) {
    res.status(404);
    throw new Error('Bài viết không tồn tại');
  }

  // Tăng lượt xem
  post.views += 1;
  await post.save();

  res.json(post);
});

// @desc    Tạo bài viết mới
// @route   POST /api/posts
// @access  Admin
const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category, tags, status, metaTitle, metaDescription, metaKeywords } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Nội dung bài viết không được để trống');
  }
  // Tạo slug từ title
  const slug = slugify(title, { lower: true, strict: true });

  // Kiểm tra trùng slug
  const existing = await Post.findOne({ slug });
  if (existing) {
    res.status(400);
    throw new Error('Slug đã tồn tại, vui lòng thay đổi tiêu đề');
  }

  const postData = {
    title,
    slug,
    content,
    excerpt,
    category: category || undefined,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    status,
    metaTitle: metaTitle || title,
    metaDescription,
    metaKeywords,
    author: req.user._id,
  };

  if (req.file) {
    postData.featuredImage = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  if (status === 'published') {
    postData.publishedAt = new Date();
  }

  const post = await Post.create(postData);
  res.status(201).json(post);
});

// @desc    Cập nhật bài viết
// @route   PUT /api/posts/:id
// @access  Admin
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Bài viết không tồn tại');
  }

  const { title, content, excerpt, category, tags, status, metaTitle, metaDescription, metaKeywords } = req.body;

  // Nếu title thay đổi, cập nhật slug
  if (title && title !== post.title) {
    const slug = slugify(title, { lower: true, strict: true });
    // Kiểm tra trùng slug
    const existing = await Post.findOne({ slug, _id: { $ne: post._id } });
    if (existing) {
      res.status(400);
      throw new Error('Slug đã tồn tại');
    }
    post.slug = slug;
  }

  post.title = title || post.title;
  post.content = content || post.content;
  post.excerpt = excerpt !== undefined ? excerpt : post.excerpt;
  post.category = category || post.category;
  post.tags = tags ? tags.split(',').map(t => t.trim()) : post.tags;
  post.metaTitle = metaTitle || post.metaTitle;
  post.metaDescription = metaDescription !== undefined ? metaDescription : post.metaDescription;
  post.metaKeywords = metaKeywords !== undefined ? metaKeywords : post.metaKeywords;

  // Xử lý trạng thái
  if (status && status !== post.status) {
    post.status = status;
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
  }

  // Xử lý ảnh mới
  if (req.file) {
    // Xóa ảnh cũ nếu có
    if (post.featuredImage) {
      const oldPath = path.join(__dirname, '..', post.featuredImage.replace(`${req.protocol}://${req.get('host')}/uploads/`, 'uploads/'));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    post.featuredImage = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  await post.save();
  res.json(post);
});

// @desc    Xóa bài viết
// @route   DELETE /api/posts/:id
// @access  Admin
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Bài viết không tồn tại');
  }

  // Xóa ảnh đại diện
  if (post.featuredImage) {
    const imagePath = path.join(__dirname, '..', post.featuredImage.replace(`${req.protocol}://${req.get('host')}/uploads/`, 'uploads/'));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  await post.deleteOne();
  res.json({ message: 'Xóa bài viết thành công' });
});

//
// @desc    Lấy bài viết theo ID (dành cho admin)
// @route   GET /api/posts/admin/:id
// @access  Admin
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('author', 'fullName');

  if (!post) {
    res.status(404);
    throw new Error('Bài viết không tồn tại');
  }

  res.json(post);
});

module.exports = {
  getPosts,
  getPostBySlug,
  getPostById,    // thêm dòng này
  createPost,
  updatePost,
  deletePost,
};