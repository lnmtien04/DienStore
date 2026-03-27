const Account = require("../models/account");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { logActivity } = require('../services/logService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerAccount = asyncHandler(async (req, res) => {
  const { fullName, username, email, password, phoneNumber, address, avatar } = req.body;

  if (!fullName || !username || !email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields.");
  }

  const usernameRegex = /^[a-z0-9_.]{6,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,}$/;

  if (!usernameRegex.test(username)) {
    res.status(400);
    throw new Error("Username must be at least 6 characters and contain lowercase letters, numbers, _ or .");
  }

  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error("Password must include uppercase, lowercase, number and special character.");
  }

  const accountExists = await Account.findOne({ $or: [{ email }, { username }] });
  if (accountExists) {
    res.status(400);
    throw new Error("Email or username already exists.");
  }

  const newAccount = await Account.create({
    fullName,
    username,
    email,
    password,
    phoneNumber,
    address,
    avatar,
  });

  const token = generateToken(newAccount._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    _id: newAccount._id,
    fullName: newAccount.fullName,
    username: newAccount.username,
    email: newAccount.email,
    avatar: newAccount.avatar,
    roles: newAccount.roles,
    token,
  });
});

const loginAccount = asyncHandler(async (req, res) => {
  console.log('req.body:', req.body);
  const { loginIdentifier, password } = req.body;
  console.log('loginIdentifier:', loginIdentifier, 'password:', password);

  if (!loginIdentifier || !password) {
    res.status(400);
    throw new Error("Please provide login credentials.");
  }

  const account = await Account.findOne({ $or: [{ email: loginIdentifier }, { username: loginIdentifier }] });
  console.log('Account found:', account ? account.email : 'NOT FOUND');
  if (account) {
    const isMatch = await account.matchPassword(password);
    console.log('Password match:', isMatch);
  }

  if (!account) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  if (!account.isActive) {
    res.status(403);
    throw new Error("Your account has been disabled.");
  }

  const token = generateToken(account._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  await logActivity({
    user: account._id,
    action: 'LOGIN',
    targetType: 'user',
    targetId: account._id,
    req,
  });

  res.status(200).json({
    _id: account._id,
    fullName: account.fullName,
    email: account.email,
    username: account.username,
    avatar: account.avatar,
    phoneNumber: account.phoneNumber,
    address: account.address,
    roles: account.roles,
    token,
    message: "Login successful",
  });
});

const logoutAccount = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});

const getAccountProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw new Error("Account not found.");
  const { password, ...safeUser } = req.user.toObject();
  res.json(safeUser);
});

const getAccountById = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id).select("-password");
  if (!account) {
    res.status(404);
    throw new Error("Account not found.");
  }

  const isAdmin = req.user.roles.includes("admin");
  const isOwner = req.user._id.toString() === account._id.toString();

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error("No permission to view this account.");
  }

  res.json(account);
});

// Sửa hàm getAllAccounts để cho phép cả admin và staff
const getAllAccounts = asyncHandler(async (req, res) => {
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('staff')) {
    res.status(403);
    throw new Error('Bạn không có quyền xem danh sách tài khoản.');
  }

  const accounts = await Account.find().select("-password");
  res.json(accounts);
});

const searchAccounts = asyncHandler(async (req, res) => {
  const { query } = req.query;
  let condition = { roles: { $nin: ["admin", "manager"] } };

  if (query) {
    const regex = new RegExp(query, "i");
    condition.$or = [
      { fullName: regex },
      { username: regex },
      { email: regex },
    ];
  }

  const accounts = await Account.find(condition).select("-password");
  res.json(accounts);
});

const updateProfile = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.user._id);
  if (!account) {
    res.status(404);
    throw new Error("Account not found.");
  }

  account.fullName = req.body.fullName ?? account.fullName;
  account.email = req.body.email ?? account.email;
  account.phoneNumber = req.body.phoneNumber ?? account.phoneNumber;
  account.address = req.body.address ?? account.address;
  account.avatar = req.body.avatar ?? account.avatar;
  account.bio = req.body.bio ?? account.bio;
  account.gender = req.body.gender ?? account.gender;
  account.dob = req.body.dob ? new Date(req.body.dob) : account.dob;
  account.background = req.body.background ?? account.background;
  account.school = req.body.school ?? account.school;
  account.company = req.body.company ?? account.company;
  account.jobTitle = req.body.jobTitle ?? account.jobTitle;

  const updated = await account.save();
  res.json({
    _id: updated._id,
    fullName: updated.fullName,
    email: updated.email,
    username: updated.username,
    roles: updated.roles,
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Không có file nào được upload');
  }
  const user = await Account.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  user.avatar = avatarUrl;
  await user.save();
  res.json({ avatar: avatarUrl });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error('Vui lòng nhập mật khẩu cũ và mới');
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
  }

  const account = await Account.findById(req.user._id);
  if (!account) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }

  const isMatch = await account.matchPassword(oldPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Mật khẩu cũ không đúng');
  }

  account.password = newPassword;
  await account.save();
  res.json({ message: 'Đổi mật khẩu thành công' });
});

const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  const validLanguages = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru'];
  if (!validLanguages.includes(language)) {
    res.status(400);
    throw new Error('Ngôn ngữ không hợp lệ');
  }
  const user = await Account.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
  user.preferredLanguage = language;
  await user.save();
  res.json({ message: 'Cập nhật ngôn ngữ thành công', preferredLanguage: language });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) {
    res.status(404);
    throw new Error("Account not found.");
  }

  const isAdmin = req.user.roles.includes("admin");
  const isOwner = req.user._id.toString() === account._id.toString();

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error("No permission to delete this account.");
  }

  await account.deleteOne();
  res.json({ message: "Account deleted successfully." });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { preferredLanguage } = req.body;
  const user = await Account.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.preferredLanguage = preferredLanguage || user.preferredLanguage;
  await user.save();
  res.json({
    message: 'Cập nhật preferences thành công',
    preferredLanguage: user.preferredLanguage
  });
});

const countUsersByRole = asyncHandler(async (req, res) => {
  const result = await Account.aggregate([
    { $unwind: '$roles' },
    { $group: { _id: '$roles', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const counts = {};
  result.forEach(item => {
    counts[item._id] = item.count;
  });
  res.json(counts);
});

// Cập nhật tài khoản (chỉ admin)
const updateAccount = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, roles, isActive, password } = req.body;
  const userId = req.params.id;

  const user = await Account.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }

  if (fullName) user.fullName = fullName;
  if (email && email !== user.email) {
    const existing = await Account.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error('Email đã được sử dụng');
    }
    user.email = email;
  }
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (roles !== undefined) user.roles = roles;
  if (isActive !== undefined) user.isActive = isActive;
  if (password && password.trim() !== '') {
    user.password = password;
  }

  const updatedUser = await user.save();
  const { password: pwd, ...safeUser } = updatedUser.toObject();
  res.json(safeUser);
});

// Hàm tạo tài khoản mới (chỉ admin)
const createAccountByAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password, phoneNumber, roles, isActive, username } = req.body;

  if (!fullName || !email || !password || !roles || !Array.isArray(roles) || roles.length === 0) {
    res.status(400);
    throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc (fullName, email, password, roles)');
  }

  const existing = await Account.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email đã được sử dụng');
  }

  const finalUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);

  const newAccount = await Account.create({
    fullName,
    email,
    password,
    phoneNumber: phoneNumber || '',
    roles,
    isActive: isActive !== undefined ? isActive : true,
    username: finalUsername,
  });

  const { password: pwd, ...safeAccount } = newAccount.toObject();
  res.status(201).json(safeAccount);
});

module.exports = {
  registerAccount,
  loginAccount,
  logoutAccount,
  getAccountProfile,
  getAccountById,
  getAllAccounts,
  searchAccounts,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadAvatar,
  countUsersByRole,
  updatePreferences,
  updateAccount,
  createAccountByAdmin,
};