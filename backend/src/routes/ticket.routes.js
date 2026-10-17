const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticket.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/:code', authenticate, TicketController.getTicket);

// Staff and Management Check-in routes
router.post('/checkin', authenticate, authorize(['admin', 'manager', 'staff']), TicketController.checkIn);
router.get('/staff/recent-checkins', authenticate, authorize(['admin', 'manager', 'staff']), TicketController.getRecentCheckins);

module.exports = router;
