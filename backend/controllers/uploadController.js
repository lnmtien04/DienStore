const path = require("path");
const multer = require("multer");
const fs = require("fs");
const asyncHandler = require("express-async-handler");

// Đảm bảo thư mục uploads tồn tại
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter file (chỉ nhận ảnh)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"), false);
  }
};

// Multer config
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Middleware upload single image
exports.uploadSingle = upload.single("image");

// Middleware upload multiple images (tối đa 5 file)
exports.uploadMultiple = upload.array("images", 5);

// Xử lý kết quả upload (phải được gọi sau middleware upload)
exports.handleUpload = asyncHandler(async (req, res) => {
  if (req.file) {
    res.json({
      success: true,
      message: "File uploaded successfully",
      fileUrl: `/uploads/${req.file.filename}`,
    });
  } else if (req.files && req.files.length > 0) {
    const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
    res.json({
      success: true,
      message: "Files uploaded successfully",
      files: fileUrls,
    });
  } else {
    res.status(400);
    throw new Error("No file uploaded");
  }
});