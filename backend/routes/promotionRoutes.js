const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  applyPromotion,
  updatePromotion,
  deletePromotion,
} = require("../controllers/promotionController");

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

// ======================================
// PUBLIC ROUTES
// ======================================
router.get("/", getAllPromotions);
router.post("/apply", applyPromotion);
router.get("/:id", validateObjectId("id"), getPromotionById);

// ======================================
// ADMIN ROUTES
// ======================================
router.post("/", protect, authorize("admin"), createPromotion);
router.put("/:id", protect, authorize("admin"), validateObjectId("id"), updatePromotion);
router.delete("/:id", protect, authorize("admin"), validateObjectId("id"), deletePromotion);

module.exports = router;