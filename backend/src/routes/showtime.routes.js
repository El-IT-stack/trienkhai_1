const express = require('express');
const router = express.Router();
const ShowtimeController = require('../controllers/showtime.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', ShowtimeController.getShowtimes);
router.get('/:id', ShowtimeController.getShowtimeDetail);
router.get('/:id/seats', ShowtimeController.getSeats);

// Protected routes (Admin & Manager)
router.post('/', authenticate, authorize(['admin', 'manager']), ShowtimeController.createShowtime);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), ShowtimeController.deleteShowtime);

module.exports = router;
