const { logger } = require('../config/logger');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn API '${req.method} ${req.originalUrl}' không tồn tại trên hệ thống.`
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.' 
      : err.message
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
