const fs = require('fs');
const path = require('path');
// Import các model
const Account = require('../models/account');
const Product = require('../models/product');
const Order = require('../models/order');
const Category = require('../models/category');
const Banner = require('../models/banner');
const Post = require('../models/post');

// Hàm tạo backup (không nén)
const createBackup = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = Date.now();
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Lấy dữ liệu từ database
    const data = {
      accounts: await Account.find({}).lean().catch(() => []),
      products: await Product.find({}).lean().catch(() => []),
      orders: await Order.find({}).lean().catch(() => []),
      categories: await Category.find({}).lean().catch(() => []),
      banners: await Banner.find({}).lean().catch(() => []),
      posts: await Post.find({}).lean().catch(() => []),
    };

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    res.json({ 
      message: 'Backup thành công', 
      filename: `backup-${timestamp}.json`,
      size: fs.statSync(backupFile).size
    });
  } catch (error) {
    console.error('🔥 Backup error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách backup
const listBackups = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) return res.json([]);
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(backupDir, f));
        return {
          name: f,
          size: stat.size,
          createdAt: stat.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tải file backup (dùng header Authorization thay vì query)
const downloadBackup = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../backups', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File không tồn tại' });
    }
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa file backup
const deleteBackup = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../backups', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File không tồn tại' });
    }
    fs.unlinkSync(filePath);
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup
};