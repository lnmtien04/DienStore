const asyncHandler = require('express-async-handler');
const Brand = require('../models/brand');
const slugify = require('slugify');

// @desc    Lấy tất cả thương hiệu (kèm số lượng sản phẩm)
// @route   GET /api/brands
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.aggregate([
    {
      $lookup: {
        from: 'Products',        // tên collection sản phẩm (viết hoa chữ P)
        localField: '_id',
        foreignField: 'brand',   // trường trong sản phẩm lưu brand ID
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' }
      }
    },
    {
      $project: { products: 0 }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    }
  ]);

  // Log để kiểm tra (có thể xóa sau)
  console.log('Brands from DB:', brands.map(b => ({ name: b.name, sortOrder: b.sortOrder, productCount: b.productCount })));

  res.json(brands);
});

// @desc    Lấy thương hiệu theo ID
// @route   GET /api/brands/:id
const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (brand) {
    res.json(brand);
  } else {
    res.status(404);
    throw new Error('Brand not found');
  }
});

// @desc    Tạo thương hiệu mới
// @route   POST /api/brands
const createBrand = asyncHandler(async (req, res) => {
  const { name, description, image, isActive, sortOrder, isFeatured } = req.body;
  const slug = slugify(name, { lower: true });

  const exists = await Brand.findOne({ slug });
  if (exists) {
    res.status(400);
    throw new Error('Brand already exists');
  }

  const brand = await Brand.create({
    name,
    slug,
    description,
    image,
    isActive: isActive !== undefined ? isActive : true,
    sortOrder: sortOrder || 0,
    isFeatured: isFeatured || false,
  });
  res.status(201).json(brand);
});

// @desc    Cập nhật thương hiệu
// @route   PUT /api/brands/:id
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  brand.name = req.body.name || brand.name;
  if (req.body.name) brand.slug = slugify(req.body.name, { lower: true });
  brand.description = req.body.description !== undefined ? req.body.description : brand.description;
  brand.image = req.body.image !== undefined ? req.body.image : brand.image;
  brand.isActive = req.body.isActive !== undefined ? req.body.isActive : brand.isActive;
  brand.sortOrder = req.body.sortOrder !== undefined ? req.body.sortOrder : brand.sortOrder;
  brand.isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : brand.isFeatured;

  const updated = await brand.save();
  res.json(updated);
});

// @desc    Xóa thương hiệu
// @route   DELETE /api/brands/:id
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  await brand.deleteOne();
  res.json({ message: 'Brand removed' });
});

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};