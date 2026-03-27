const express = require("express");
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

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
  updatePreferences,
  updateAccount,
  createAccountByAdmin, // import hàm mới
} = require("../controllers/accountController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Account = require("../models/account");

/* =====================================================
   PUBLIC ROUTES
===================================================== */
router.post("/register", registerAccount);
router.post("/login", loginAccount);
router.post("/logout", logoutAccount);

/* =====================================================
   USER ROUTES (Yêu cầu đăng nhập)
===================================================== */
// Lấy profile của chính mình
router.get("/profile", protect, getAccountProfile);
// Cập nhật profile
router.put("/profile", protect, updateProfile);
// Đổi mật khẩu
router.put("/change-password", protect, changePassword);
// Upload avatar
router.post("/upload-avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được gửi lên" });
    }
    const avatarUrl = req.file.path;
    const user = await Account.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }
    user.avatar = avatarUrl;
    await user.save();
    res.status(200).json({ message: "Upload avatar thành công", url: avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// Cập nhật preferences
router.put("/preferences", protect, updatePreferences);

/* =====================================================
   SEARCH ROUTE
===================================================== */
router.get("/search", protect, searchAccounts);

/* =====================================================
   ADMIN & STAFF ROUTES
===================================================== */
// Lấy tất cả tài khoản - cho phép admin và staff
router.get("/", protect, authorize("admin", "staff"), getAllAccounts);

/* =====================================================
   ADMIN-ONLY ROUTES
===================================================== */
// Tạo tài khoản mới (chỉ admin)
router.post("/", protect, authorize("admin"), createAccountByAdmin);
// Thống kê theo role (chỉ admin)
router.get('/count-by-role', protect, authorize('admin', 'staff'), countUsersByRole);
// Lấy tài khoản theo ID (chỉ admin)
router.get("/:id", protect, authorize("admin"), getAccountById);
// Cập nhật tài khoản (chỉ admin)
router.put("/:id", protect, authorize("admin"), updateAccount);
// Xoá tài khoản (chỉ admin)
router.delete("/:id", protect, authorize("admin"), deleteAccount);

module.exports = router;