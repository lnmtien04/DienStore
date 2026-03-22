const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads/reviews tồn tại
const uploadDir = path.join(__dirname, '../uploads/reviews');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'review-' + uniqueSuffix + ext);
  }
});

// Filter chỉ cho phép file ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Hàm upload nhiều ảnh (tối đa 5)
const uploadReviewImages = upload.array('images', 5);

// Hàm xử lý upload và trả về đường dẫn
const handleUpload = (req, res, next) => {
  uploadReviewImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    // Trả về mảng đường dẫn các file đã upload
    const files = req.files;
    if (!files || files.length === 0) {
      req.uploadedImages = [];
    } else {
      req.uploadedImages = files.map(file => `/uploads/reviews/${file.filename}`);
    }
    next();
  });
};

module.exports = { handleUpload };