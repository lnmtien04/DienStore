const express = require("express");
const router = express.Router();
const {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");
const { protect } = require("../middleware/authMiddleware"); // SỬA Ở ĐÂY: bỏ 's'

router.post("/", protect, createAddress);
router.get("/", protect, getMyAddresses);
router.get("/:id", protect, getAddressById);
router.put("/:id", protect, updateAddress);
router.delete("/:id", protect, deleteAddress);
router.put("/:id/default", protect, setDefaultAddress);

module.exports = router;