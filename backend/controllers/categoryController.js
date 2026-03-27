const asyncHandler = require('express-async-handler');
const Category = require('../models/category');
const Product = require('../models/product'); // Import model Product
const slugify = require('slugify');

// @desc    Get all categories with product count
const getCategories = asyncHandler(async (req, res) => {
  // Lấy tất cả danh mục (lean để tối ưu)
  const categories = await Category.find().populate('parent', 'name').lean();

  // Đếm số sản phẩm cho từng danh mục
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat._id });
      return { ...cat, productCount };
    })
  );

  res.json(categoriesWithCount);
});

// @desc    Get category by ID
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate('parent', 'name');
  if (category) res.json(category);
  else { res.status(404); throw new Error('Category not found'); }
});

// @desc    Get category by slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate('parent', 'name');
  if (category) res.json(category);
  else { res.status(404); throw new Error('Category not found'); }
});

// @desc    Create a new category
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
    // Cloudinary trả về URL trong req.file.path
    imageUrl = req.file.path;
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
    // Cập nhật ảnh từ Cloudinary
    category.image = req.file.path;
    // Không cần xóa ảnh cũ vì Cloudinary sẽ tự quản lý (hoặc nếu muốn xóa, gọi cloudinary.uploader.destroy)
  }

  const updated = await category.save();
  res.json(updated);
});

// @desc    Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Không cần xóa file ảnh local, Cloudinary có thể xóa nếu muốn (tùy chọn)
  // if (category.image) {
  //   const publicId = category.image.split('/').slice(-2).join('/').split('.')[0];
  //   await cloudinary.uploader.destroy(publicId);
  // }

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