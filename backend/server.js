const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('MONGO_URI from env:', process.env.MONGO_URI);

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();

// CORS (chỉ một lần, sau khi có app)
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000', 
  credentials: true 
}));

// Middleware cơ bản
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Phục vụ file tĩnh
app.use("/uploads", express.static(uploadDir));

// Routes
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/shippers', require('./routes/shipperRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/warranties', require('./routes/warrantyRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/statistics', require('./routes/statisticRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/audits', require('./routes/auditRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/accounts/avatar', (req, res) => res.status(200).json({}));
// Error handling
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));