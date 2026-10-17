require('dotenv').config();
const app = require('./app');
const { initDatabaseWithRetry, getPool } = require('./config/database');
const { logger } = require('./config/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
  try {
    logger.info('=== KHỞI ĐỘNG CINEEVENT BACKEND SERVICE ===');

    // Initialize Database with automatic retry loop
    await initDatabaseWithRetry();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`CineEvent Backend đang lắng nghe tại cổng http://0.0.0.0:${PORT}`);
      logger.info(`Prometheus Metrics endpoint: http://0.0.0.0:${PORT}/metrics`);
      logger.info(`Health check endpoint: http://0.0.0.0:${PORT}/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`Nhận tín hiệu ${signal}. Đang tắt dịch vụ an toàn...`);
      server.close(async () => {
        logger.info('Đã đóng kết nối HTTP.');
        try {
          const pool = getPool();
          await pool.end();
          logger.info('Đã giải phóng database pool kết nối MySQL.');
        } catch (e) {}
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Quá thời gian chờ shutdown, tiến hành dừng cưỡng bức.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error(`Không thể khởi động CineEvent Backend: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

startServer();
