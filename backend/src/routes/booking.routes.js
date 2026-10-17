const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.post('/', authenticate, BookingController.createBooking);
router.get('/my-bookings', authenticate, BookingController.getMyBookings);
router.get('/all', authenticate, authorize(['admin', 'manager', 'staff']), BookingController.getAllBookings);
router.get('/:idOrCode', authenticate, BookingController.getBookingDetail);

module.exports = router;
