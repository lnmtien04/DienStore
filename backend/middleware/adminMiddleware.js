const jwt = require('jsonwebtoken');
const Account = require('../models/account');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Không có token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Account.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    req.user = user; // user có đầy đủ thông tin, bao gồm role
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};