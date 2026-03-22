const jwt = require("jsonwebtoken");
const Account = require("../models/account");
const asyncHandler = require("express-async-handler");

// Middleware bắt buộc phải có token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Account.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('AuthMiddleware - Error:', error.message);
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

// Middleware tùy chọn (có token thì lấy user, không thì vẫn cho qua)
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Account.findById(decoded.id).select("-password");
      req.user = user || null;
    } catch (error) {
      console.error('optionalAuth - Error:', error.message);
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

// Middleware admin (yêu cầu đã có req.user từ protect)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};