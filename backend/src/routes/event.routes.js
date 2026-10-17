const express = require('express');
const router = express.Router();
const EventController = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', EventController.getEvents);
router.get('/:idOrSlug', EventController.getEventDetail);

// Protected routes (Admin & Manager)
router.post('/', authenticate, authorize(['admin', 'manager']), EventController.createEvent);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), EventController.deleteEvent);

module.exports = router;
