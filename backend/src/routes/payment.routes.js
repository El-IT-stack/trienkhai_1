const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/simulate', authenticate, PaymentController.simulatePayment);

module.exports = router;
