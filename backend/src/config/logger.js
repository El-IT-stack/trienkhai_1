const fs = require('fs');
const path = require('path');

const logDir = process.env.LOG_DIR || (process.env.NODE_ENV === 'production' ? '/var/log/cineevent' : path.join(__dirname, '../../logs'));

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error(`Không thể tạo thư mục log: ${logDir}`, err.message);
}

const logFilePath = path.join(logDir, 'app.log');

const writeToFile = (logLine) => {
  try {
    fs.appendFileSync(logFilePath, logLine + '\n', 'utf8');
  } catch (err) {
    // Fallback silently to console if cannot write file
  }
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const formatted = `[${timestamp}] [${level.toUpperCase()}] [cineevent-app] ${message}${metaStr}`;
  return formatted;
};

const logger = {
  info: (message, meta) => {
    const logLine = formatMessage('info', message, meta);
    console.log(logLine);
    writeToFile(logLine);
  },
  warn: (message, meta) => {
    const logLine = formatMessage('warn', message, meta);
    console.warn(logLine);
    writeToFile(logLine);
  },
  error: (message, meta) => {
    const logLine = formatMessage('error', message, meta);
    console.error(logLine);
    writeToFile(logLine);
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      const logLine = formatMessage('debug', message, meta);
      console.log(logLine);
      writeToFile(logLine);
    }
  }
};

module.exports = {
  logger,
  logFilePath
};
