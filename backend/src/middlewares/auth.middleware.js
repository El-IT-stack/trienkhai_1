const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_cineevent_change_in_production_2026!';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập. Không tìm thấy token xác thực hợp lệ.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Token xác thực không hợp lệ hoặc đã hết hạn: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.'
    });
  }
};

// Optional authentication (for endpoints that can serve both guests and logged-in users)
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ignore token parse failure for optional auth
    }
  }
  next();
};

// Role-based authorization
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập vào hệ thống.'
      });
    }

    const userRole = req.user.role_name ? req.user.role_name.toLowerCase() : '';
    if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      logger.warn(`Từ chối quyền truy cập (403): User ID ${req.user.id} vai trò [${userRole}] cố gắng truy cập endpoint yêu cầu [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize
};
