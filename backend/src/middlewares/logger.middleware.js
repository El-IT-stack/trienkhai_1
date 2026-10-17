const { logger } = require('../config/logger');

const httpLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logMsg = `HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms [IP: ${clientIp}]`;

    if (statusCode >= 500) {
      logger.error(logMsg);
    } else if (statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
};

module.exports = {
  httpLoggerMiddleware
};
