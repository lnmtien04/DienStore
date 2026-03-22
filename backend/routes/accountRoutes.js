const express = require("express");
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // chỉ một lần

const {
  registerAccount,
  loginAccount,
  logoutAccount,
  getAccountProfile,
  updateProfile,
  changePassword,
  getAllAccounts,
  getAccountById,
  searchAccounts,
  deleteAccount,
  countUsersByRole,
  updatePreferences,  // Import hàm này
  // updateAccount, // nếu có
} = require("../controllers/accountController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Account = require("../models/account");

/* =====================================================
   PUBLIC ROUTES
===================================================== */

// Đăng ký
router.post("/register", registerAccount);

// Đăng nhập
router.post("/login", loginAccount);

// Đăng xuất
router.post("/logout", logoutAccount);

/* =====================================================
   USER ROUTES (Yêu cầu đăng nhập)
===================================================== */

// Lấy profile của chính mình
router.get("/profile", protect, getAccountProfile);

// Cập nhật profile
router.put("/profile", protect, updateProfile);

// Đổi mật khẩu (chỉ cần một lần)
router.put("/change-password", protect, changePassword);

// Upload avatar
router.post(
  "/upload-avatar",
  protect,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được gửi lên" });
      }

      const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      const user = await Account.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      user.avatar = avatarUrl;
      await user.save();

      res.status(200).json({
        message: "Upload avatar thành công",
        url: avatarUrl,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
);

// Cập nhật preferences (ngôn ngữ, giao diện...)
router.put("/preferences", protect, updatePreferences);

/* =====================================================
   SEARCH ROUTE
===================================================== */
router.get("/search", protect, searchAccounts);

/* =====================================================
   ADMIN ROUTES
===================================================== */
router.get('/count-by-role', protect, authorize('admin'), countUsersByRole);

// Lấy tất cả tài khoản
router.get("/", protect, authorize("admin"), getAllAccounts);

// Lấy tài khoản theo ID
router.get("/:id", protect, authorize("admin"), getAccountById);

// Xoá tài khoản
router.delete("/:id", protect, authorize("admin"), deleteAccount);

// Nếu có updateAccount cho admin:
// router.put("/:id", protect, authorize("admin"), updateAccount);

module.exports = router;