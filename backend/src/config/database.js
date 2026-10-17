const mysql = require('mysql2/promise');
const { logger } = require('./logger');

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  user: process.env.MYSQL_USER || 'cineevent_user',
  password: process.env.MYSQL_PASSWORD || 'CineEvent_UserSecurePass_2026!',
  database: process.env.MYSQL_DATABASE || 'cineevent_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

let pool = null;

const initDatabaseWithRetry = async (maxRetries = 20, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Đang kết nối tới MySQL tại ${dbConfig.host}:${dbConfig.port} (lần ${attempt}/${maxRetries})...`);
      pool = mysql.createPool(dbConfig);
      
      // Test connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();

      logger.info('Kết nối MySQL thành công và sẵn sàng phục vụ!');
      return pool;
    } catch (err) {
      logger.warn(`Chưa thể kết nối tới MySQL (lần ${attempt}/${maxRetries}): ${err.message}. Thử lại sau ${delayMs / 1000}s...`);
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }
      if (attempt === maxRetries) {
        logger.error('Đã vượt quá số lần thử kết nối MySQL. Ứng dụng dừng khởi động.');
        throw err;
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool chưa được khởi tạo. Vui lòng gọi initDatabaseWithRetry trước.');
  }
  return pool;
};

module.exports = {
  initDatabaseWithRetry,
  getPool
};
