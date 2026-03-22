const ActivityLog = require('../models/activitylog');

const logActivity = async ({ user, action, targetType, targetId, changes, req }) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await ActivityLog.create({
      user,
      action,
      targetType,
      targetId,
      changes,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error('Lỗi ghi activity log:', error);
  }
};

module.exports = { logActivity };