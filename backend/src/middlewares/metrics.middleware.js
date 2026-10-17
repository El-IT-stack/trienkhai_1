const client = require('prom-client');

// Create a custom registry
const register = new client.Registry();

// Enable collection of default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'cineevent_'
});

// Custom HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'cineevent_http_requests_total',
  help: 'Tổng số lượt HTTP request đến CineEvent Backend',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Custom HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'cineevent_http_request_duration_seconds',
  help: 'Thời gian phản hồi HTTP request tính bằng giây',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Custom Business Metrics: Bookings counter
const bookingCounter = new client.Counter({
  name: 'cineevent_bookings_total',
  help: 'Tổng số đơn đặt vé theo loại và trạng thái',
  labelNames: ['type', 'status'],
  registers: [register]
});

// Custom Business Metrics: Payments counter
const paymentCounter = new client.Counter({
  name: 'cineevent_payments_total',
  help: 'Tổng số giao dịch thanh toán giả lập theo phương thức và kết quả',
  labelNames: ['method', 'status'],
  registers: [register]
});

const metricsMiddleware = (req, res, next) => {
  // Avoid tracking /metrics endpoint itself to prevent skew
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Normalize route to avoid high cardinality labels
    const route = req.baseUrl + (req.route ? req.route.path : req.path);
    const statusCode = res.statusCode ? res.statusCode.toString() : '500';

    httpRequestCounter.inc({
      method: req.method,
      route: route.replace(/\/\d+/g, '/:id'),
      status_code: statusCode
    });

    httpRequestDuration.observe({
      method: req.method,
      route: route.replace(/\/\d+/g, '/:id'),
      status_code: statusCode
    }, durationInSeconds);
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  bookingCounter,
  paymentCounter
};
