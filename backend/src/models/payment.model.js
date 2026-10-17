const { getPool } = require('../config/database');
const { bookingCounter, paymentCounter } = require('../middlewares/metrics.middleware');

const PaymentModel = {
  async processSimulatedPayment({ bookingId, action, paymentMethod = 'SIMULATED_VNPAY' }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch booking with items
      const [bookings] = await connection.query(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [bookingId]
      );

      if (bookings.length === 0) {
        throw new Error('Đơn đặt vé không tồn tại.');
      }

      const booking = bookings[0];

      if (booking.status === 'confirmed') {
        throw new Error('Đơn đặt vé này đã được thanh toán thành công trước đó.');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Đơn đặt vé này đã bị hủy.');
      }

      // Check if expired
      const now = new Date();
      if (new Date(booking.expires_at) < now) {
        await connection.query("UPDATE bookings SET status = 'expired' WHERE id = ?", [bookingId]);
        await connection.commit();
        throw new Error('Đơn đặt vé đã hết thời gian giữ chỗ (quá 15 phút). Vui lòng đặt lại.');
      }

      const txnCode = `TXN-${paymentMethod.replace('SIMULATED_', '')}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (action === 'SUCCESS') {
        // Record successful payment
        const [payRes] = await connection.query(
          `INSERT INTO payments 
           (booking_id, transaction_code, payment_method, amount, status, payment_time, response_note) 
           VALUES (?, ?, ?, ?, 'success', NOW(), 'Thanh toán giả lập thành công cho môi trường demo')`,
          [bookingId, txnCode, paymentMethod, booking.total_amount]
        );

        // Update booking status
        await connection.query("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [bookingId]);

        // Issue tickets for each booking item
        const [items] = await connection.query(
          'SELECT * FROM booking_items WHERE booking_id = ?',
          [bookingId]
        );

        const issuedTickets = [];
        for (const item of items) {
          // If event ticket with quantity > 1, create individual tickets
          const count = item.quantity || 1;
          for (let i = 0; i < count; i++) {
            const ticketCode = `TCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const qrData = `CINEEVENT:${booking.booking_code}:${ticketCode}:${item.seat_id || item.ticket_type_id}`;

            const [tckRes] = await connection.query(
              `INSERT INTO tickets (booking_id, booking_item_id, ticket_code, qr_data, status) 
               VALUES (?, ?, ?, ?, 'valid')`,
              [bookingId, item.id, ticketCode, qrData]
            );

            issuedTickets.push({
              id: tckRes.insertId,
              ticket_code: ticketCode,
              qr_data: qrData,
              status: 'valid'
            });
          }
        }

        await connection.commit();

        // Increment business metrics
        try {
          bookingCounter.inc({ type: booking.booking_type, status: 'confirmed' });
          paymentCounter.inc({ method: paymentMethod, status: 'success' });
        } catch (e) {}

        return {
          success: true,
          status: 'success',
          transaction_code: txnCode,
          booking_code: booking.booking_code,
          total_amount: booking.total_amount,
          tickets: issuedTickets,
          message: 'Thanh toán giả lập thành công! Vé điện tử đã được phát hành.'
        };
      } else if (action === 'FAILED') {
        // Record failed payment
        await connection.query(
          `INSERT INTO payments 
           (booking_id, transaction_code, payment_method, amount, status, payment_time, response_note) 
           VALUES (?, ?, ?, ?, 'failed', NOW(), 'Người dùng mô phỏng thanh toán thất bại (tài khoản không đủ số dư / lỗi thẻ)')`,
          [bookingId, txnCode, paymentMethod, booking.total_amount]
        );

        await connection.commit();

        try {
          paymentCounter.inc({ method: paymentMethod, status: 'failed' });
        } catch (e) {}

        return {
          success: false,
          status: 'failed',
          transaction_code: txnCode,
          message: 'Thanh toán giả lập thất bại. Giao dịch bị từ chối bởi cổng thanh toán mô phỏng.'
        };
      } else if (action === 'CANCELLED') {
        // Mark cancelled
        await connection.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
        
        await connection.query(
          `INSERT INTO payments 
           (booking_id, transaction_code, payment_method, amount, status, payment_time, response_note) 
           VALUES (?, ?, ?, ?, 'cancelled', NOW(), 'Người dùng chủ động hủy giao dịch thanh toán')`,
          [bookingId, txnCode, paymentMethod, booking.total_amount]
        );

        await connection.commit();

        try {
          bookingCounter.inc({ type: booking.booking_type, status: 'cancelled' });
          paymentCounter.inc({ method: paymentMethod, status: 'cancelled' });
        } catch (e) {}

        return {
          success: false,
          status: 'cancelled',
          transaction_code: txnCode,
          message: 'Bạn đã hủy quá trình thanh toán đơn đặt vé.'
        };
      } else {
        throw new Error(`Hành động thanh toán '${action}' không được hỗ trợ.`);
      }
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = PaymentModel;
