const PaymentModel = require('../models/payment.model');
const BookingModel = require('../models/booking.model');
const UserModel = require('../models/user.model');
const { logger } = require('../config/logger');

const PaymentController = {
  async simulatePayment(req, res, next) {
    try {
      const { booking_id, action, payment_method } = req.body;

      if (!booking_id || !action) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã đơn đặt vé (booking_id) và hành động thanh toán (action).'
        });
      }

      // Check ownership
      const booking = await BookingModel.getById(booking_id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin đơn đặt vé.'
        });
      }

      if (req.user.role_name === 'customer' && booking.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thực hiện thanh toán cho đơn hàng này.'
        });
      }

      const result = await PaymentModel.processSimulatedPayment({
        bookingId: booking_id,
        action,
        paymentMethod: payment_method || 'SIMULATED_VNPAY'
      });

      await UserModel.logAudit(
        req.user.id,
        `PAYMENT_SIMULATE_${action}`,
        'payment',
        `Thanh toán giả lập cho đơn ${booking.booking_code} kết quả: ${result.status} (Mã GD: ${result.transaction_code})`,
        req.ip
      );

      logger.info(`Thanh toán giả lập: Booking [${booking.booking_code}] Action [${action}] Status [${result.status}]`);

      res.json(result);
    } catch (err) {
      logger.warn(`Lỗi xử lý thanh toán giả lập: ${err.message}`);
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
};

module.exports = PaymentController;
