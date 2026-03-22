const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {
  createShippingRequest,
  getAllShippingRequests,
  getAvailableRequests,
  assignShipper,
  updateShippingStatus,
  getMyRequests, // Nếu có trong controller
} = require("../controllers/shippingRequestController");

const { protect, authorize } = require("../middlewares/authMiddleware");

// Middleware kiểm tra ObjectId hợp lệ
const validateObjectId = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName} format`,
    });
  }
  next();
};

/* =====================================================
   ADMIN ROUTES
===================================================== */
// Tạo shipping request (admin)
router.post("/", protect, authorize("admin"), createShippingRequest);

// Lấy tất cả shipping requests (admin) – có phân trang, lọc
router.get("/", protect, authorize("admin"), getAllShippingRequests);

/* =====================================================
   SHIPPER ROUTES
===================================================== */
// Lấy danh sách đơn đang chờ nhận
router.get("/available", protect, authorize("shipper"), getAvailableRequests);

// Lấy danh sách đơn mình đã nhận
router.get("/my-requests", protect, authorize("shipper"), getMyRequests);

// Nhận đơn (shipper nhận)
router.put("/:id/assign", protect, authorize("shipper"), validateObjectId("id"), assignShipper);

// Cập nhật trạng thái giao hàng (shipper)
router.put("/:id/status", protect, authorize("shipper"), validateObjectId("id"), updateShippingStatus);

module.exports = router;