const express = require('express');
const router = express.Router();
const { register } = require('../middlewares/metrics.middleware');
const { getPool } = require('../config/database');

// Prometheus scrape endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    res.end(metricsData);
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Health check endpoint for Docker Compose and uptime probes
router.get('/health', async (req, res) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'cineevent-backend',
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      service: 'cineevent-backend',
      database: err.message
    });
  }
});

module.exports = router;
