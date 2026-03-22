const asyncHandler = require('express-async-handler');
const Category = require('../models/Category'); // Đảm bảo tên file model đúng (Category.js hoặc category.js)
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

// Helper xóa file ảnh
const deleteImageFile = (imageUrl, protocol, host) => {
  if (!imageUrl) return;
  const relativePath = imageUrl.replace(`${protocol}://${host}/uploads/`, 'uploads/');
  const absolutePath = path.resolve(__dirname, '..', relativePath);
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
};

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'products',        // Tên collection products (viết thường)
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $addFields: { productCount: { $size: '$products' } }
    },
    { $project: { products: 0 } }
  ]);
  res.json(categories);
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate('parent', 'name');
  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate('parent', 'name');
  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Create a new category
// @route   POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive, parent, metaTitle, metaDescription, showOnHome, showInMenu } = req.body;
  const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

  const existing = await Category.findOne({ slug });
  if (existing) {
    res.status(400);
    throw new Error('Category with this slug already exists');
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const category = await Category.create({
    name,
    slug,
    description,
    isActive: isActive === 'true' || isActive === true,
    parent: parent || null,
    image: imageUrl,
    metaTitle,
    metaDescription,
    showOnHome: showOnHome === 'true' || showOnHome === true,
    showInMenu: showInMenu === 'true' || showInMenu === true,
  });

  res.status(201).json(category);
});

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const { name, description, isActive, parent, metaTitle, metaDescription, showOnHome, showInMenu } = req.body;

  if (name && name !== category.name) {
    const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });
    const existing = await Category.findOne({ slug, _id: { $ne: category._id } });
    if (existing) {
      res.status(400);
      throw new Error('Slug already exists');
    }
    category.slug = slug;
    category.name = name;
  }

  category.description = description !== undefined ? description : category.description;
  category.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : category.isActive;
  category.parent = parent || null;
  category.metaTitle = metaTitle !== undefined ? metaTitle : category.metaTitle;
  category.metaDescription = metaDescription !== undefined ? metaDescription : category.metaDescription;
  category.showOnHome = showOnHome !== undefined ? (showOnHome === 'true' || showOnHome === true) : category.showOnHome;
  category.showInMenu = showInMenu !== undefined ? (showInMenu === 'true' || showInMenu === true) : category.showInMenu;

  if (req.file) {
    if (category.image) deleteImageFile(category.image, req.protocol, req.get('host'));
    category.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const updated = await category.save();
  res.json(updated);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (category.image) deleteImageFile(category.image, req.protocol, req.get('host'));
  await category.deleteOne();
  res.json({ message: 'Category removed' });
});

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};