const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const { httpLoggerMiddleware } = require('./middlewares/logger.middleware');
const { metricsMiddleware } = require('./middlewares/metrics.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const eventRoutes = require('./routes/event.routes');
const showtimeRoutes = require('./routes/showtime.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const adminRoutes = require('./routes/admin.routes');
const metricsRoutes = require('./routes/metrics.routes');

const app = express();

// Trust reverse proxy (Nginx) headers
app.set('trust proxy', 1);

// Security Headers (Hardening requirement)
app.use(helmet({
  contentSecurityPolicy: false, // Let Nginx handle CSP specifically or keep relaxed for CDN assets
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors());

// Parse JSON and URL-encoded request bodies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logging & Prometheus Metrics Middlewares
app.use(httpLoggerMiddleware);
app.use(metricsMiddleware);

// Mount Metrics & Health routes at root
app.use('/', metricsRoutes);

// General API Rate Limiting
app.use('/api/', apiLimiter);

// Mount REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// Serve Frontend Static Files
let frontendPath = path.join(__dirname, '../frontend');
if (!fs.existsSync(frontendPath)) {
  frontendPath = path.join(__dirname, '../../frontend');
}
app.use(express.static(frontendPath));

// Fallback for SPA/HTML navigation if file not found
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/metrics') {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
