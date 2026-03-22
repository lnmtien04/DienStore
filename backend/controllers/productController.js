const asyncHandler = require('express-async-handler');
const Product = require('../models/product');
const Category = require('../models/category');
const slugify = require('slugify');
const ExcelJS = require('exceljs');
const Warranty = require('../models/warranty'); 
const mongoose = require('mongoose');

// Helper để chuẩn hóa sản phẩm
const normalizeProduct = (product) => {
  if (!product) return null;
  const obj = product.toObject ? product.toObject() : product;
  return {
    ...obj,
    price: Number(obj.price) || 0,
    discount: Number(obj.discount) || 0,
    stock: Number(obj.stock) || 0,
    importPrice: Number(obj.importPrice) || 0,
    sold: Number(obj.sold) || 0,
    rating: Number(obj.rating) || 0,
    reviewCount: Number(obj.reviewCount) || 0,
    views: Number(obj.views) || 0,
  };
};

// @desc    Lấy tất cả sản phẩm (có hỗ trợ phân trang, lọc theo category, flashSale)
// @route   GET /api/products
// @access  Public/Admin
const getProducts = asyncHandler(async (req, res) => {
  try {
    const { limit, sort, category, flashSale, page = 1, search } = req.query; // thêm search
    const pageSize = parseInt(limit) || 12;
    const skip = (parseInt(page) - 1) * pageSize;

    let filter = {};

    // 🆕 XỬ LÝ TÌM KIẾM
    if (search) {
      // Tìm kiếm không dấu, không phân biệt hoa thường
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Xử lý lọc theo category (giữ nguyên)
    if (category) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category);
      if (isValidObjectId) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          filter.category = cat._id;
        } else {
          return res.json({
            products: [],
            totalPages: 0,
            currentPage: parseInt(page),
            total: 0
          });
        }
      }
    }

    // Xử lý flash sale (giữ nguyên)
    if (flashSale === 'true') {
      filter.discount = { $gte: 20 };
      filter.stock = { $gt: 0 };
    }

    // Đếm tổng và query (giữ nguyên)
    const total = await Product.countDocuments(filter);
    let query = Product.find(filter)
      .populate('category', 'name slug')
      .skip(skip)
      .limit(pageSize);

    if (sort) {
      let sortField = sort;
      let sortOrder = 1;
      if (sort.startsWith('-')) {
        sortField = sort.substring(1);
        sortOrder = -1;
      }
      query = query.sort({ [sortField]: sortOrder });
    }

    const products = await query;
    const normalizedProducts = products.map(p => normalizeProduct(p));

    res.json({
      products: normalizedProducts,
      totalPages: Math.ceil(total / pageSize),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('🔥 Lỗi chi tiết getProducts:', error);
    res.status(500).json({ 
      message: 'Lỗi khi tải sản phẩm', 
      error: error.message 
    });
  }
});

// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public/Admin
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');
  if (product) {
    res.json(normalizeProduct(product));
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Lấy sản phẩm theo slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category');
  if (product) {
    res.json(normalizeProduct(product));
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, description, price, discount, category, 
    importPrice, origin, warranty, brand, images, stock 
  } = req.body;
  
  const slug = slugify(name, { lower: true });

  const productExists = await Product.findOne({ slug });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this name already exists');
  }

  const product = await Product.create({
    name,
    slug,
    description,
    price: Number(price) || 0,
    discount: Number(discount) || 0,
    category,
    importPrice: Number(importPrice) || 0,
    origin: origin || '',
    warranty: warranty || null,
    brand: brand || '',
    images: images || [],
    stock: Number(stock) || 0,
  });

  res.status(201).json(normalizeProduct(product));
});

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { 
    name, description, price, discount, category, 
    importPrice, origin, warranty, brand, images, stock, isActive 
  } = req.body;

  if (name && name !== product.name) {
    product.slug = slugify(name, { lower: true });
  }
  product.name = name || product.name;
  product.description = description !== undefined ? description : product.description;
  product.price = price !== undefined ? Number(price) : product.price;
  product.discount = discount !== undefined ? Number(discount) : product.discount;
  product.category = category || product.category;
  product.importPrice = importPrice !== undefined ? Number(importPrice) : product.importPrice;
  product.origin = origin !== undefined ? origin : product.origin;
  product.warranty = warranty !== undefined ? warranty : product.warranty;
  product.brand = brand !== undefined ? brand : product.brand;
  product.images = images || product.images;
  product.stock = stock !== undefined ? Number(stock) : product.stock;
  product.isActive = isActive !== undefined ? isActive : product.isActive;

  const updated = await product.save();
  res.json(normalizeProduct(updated));
});

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ message: 'Product removed' });
});

// @desc    Xuất danh sách sản phẩm ra file Excel
// @route   GET /api/products/export
// @access  Private/Admin
const exportProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('category', 'name')
    .populate('warranty', 'name duration')
    .lean();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sản phẩm');

  worksheet.columns = [
    { header: 'ID', key: '_id', width: 30 },
    { header: 'Tên sản phẩm', key: 'name', width: 30 },
    { header: 'Giá', key: 'price', width: 15 },
    { header: 'Giảm giá (%)', key: 'discount', width: 10 },
    { header: 'Tồn kho', key: 'stock', width: 10 },
    { header: 'Danh mục', key: 'category', width: 20 },
    { header: 'Thương hiệu', key: 'brand', width: 20 },
    { header: 'Nơi sản xuất', key: 'origin', width: 20 },
    { header: 'Bảo hành', key: 'warranty', width: 15 },
    { header: 'Giá nhập', key: 'importPrice', width: 15 },
    { header: 'Trạng thái', key: 'isActive', width: 10 },
  ];

  products.forEach(p => {
    worksheet.addRow({
      _id: p._id.toString(),
      name: p.name,
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      category: p.category?.name || '',
      brand: p.brand || '',
      origin: p.origin || '',
      warranty: p.warranty ? p.warranty.name : '',
      importPrice: p.importPrice || 0,
      isActive: p.isActive ? 'Hoạt động' : 'Ẩn',
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

// @desc    Nhập sản phẩm từ file Excel
// @route   POST /api/products/import
// @access  Private/Admin
const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Vui lòng tải lên file Excel');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  const worksheet = workbook.getWorksheet(1);

  const results = { success: 0, errors: [] };

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const rowNumber = i;

    const name = row.getCell(2).value;
    const price = row.getCell(3).value;
    const discount = row.getCell(4).value || 0;
    const stock = row.getCell(5).value || 0;
    const categoryName = row.getCell(6).value;
    const brand = row.getCell(7).value;
    const origin = row.getCell(8).value;
    const warranty = row.getCell(9).value;
    const importPrice = row.getCell(10).value || 0;
    const isActive = row.getCell(11).value === 'Hoạt động';

    if (!name || !price || !categoryName) {
      results.errors.push(`Dòng ${rowNumber}: Thiếu tên, giá hoặc danh mục`);
      continue;
    }

    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      results.errors.push(`Dòng ${rowNumber}: Danh mục "${categoryName}" không tồn tại`);
      continue;
    }

    const slug = slugify(name, { lower: true });
    let product = await Product.findOne({ slug });

    if (product) {
      product.name = name;
      product.price = Number(price);
      product.discount = Number(discount);
      product.stock = Number(stock);
      product.category = category._id;
      product.brand = brand;
      product.origin = origin;
      product.warranty = warranty;
      product.importPrice = Number(importPrice);
      product.isActive = isActive;
    } else {
      product = new Product({
        name,
        slug,
        price: Number(price),
        discount: Number(discount),
        stock: Number(stock),
        category: category._id,
        brand,
        origin,
        warranty,
        importPrice: Number(importPrice),
        isActive,
        images: [],
      });
    }

    await product.save();
    results.success++;
  }

  res.json({ message: 'Import hoàn tất', results });
});

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProducts,
  importProducts
};