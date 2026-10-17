const { getPool } = require('../config/database');

const TicketModel = {
  async getByCode(ticketCode) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT t.*, 
              b.booking_code, b.booking_type, b.total_amount,
              u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
              s.start_time as showtime_start,
              m.title as movie_title, m.poster_url as movie_poster,
              e.title as event_title, e.venue_name, e.venue_address,
              r.name as room_name,
              c.name as cinema_name,
              st.seat_row, st.seat_number, st.seat_type,
              tt.name as ticket_type_name,
              tc.checkin_time, tc.notes as checkin_notes,
              staff.full_name as staff_name
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN booking_items bi ON t.booking_item_id = bi.id
       LEFT JOIN seats st ON bi.seat_id = st.id
       LEFT JOIN ticket_types tt ON bi.ticket_type_id = tt.id
       LEFT JOIN showtimes s ON b.showtime_id = s.id
       LEFT JOIN movies m ON s.movie_id = m.id
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN cinemas c ON r.cinema_id = c.id
       LEFT JOIN events e ON b.event_id = e.id
       LEFT JOIN ticket_checkins tc ON tc.ticket_id = t.id
       LEFT JOIN users staff ON tc.staff_id = staff.id
       WHERE t.ticket_code = ?`,
      [ticketCode]
    );

    return rows[0] || null;
  },

  async checkIn({ ticketCode, staffId, notes = '' }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const ticket = await this.getByCode(ticketCode);
      if (!ticket) {
        throw new Error(`Không tìm thấy vé có mã '${ticketCode}' trên hệ thống.`);
      }

      if (ticket.status === 'used') {
        const timeStr = ticket.checkin_time ? new Date(ticket.checkin_time).toLocaleString('vi-VN') : 'trước đó';
        throw new Error(`Vé này ĐÃ ĐƯỢC SỬ DỤNG vào lúc ${timeStr} bởi nhân viên ${ticket.staff_name || 'hệ thống'}. Không thể check-in lại!`);
      }

      if (ticket.status === 'cancelled') {
        throw new Error('Vé này ĐÃ BỊ HỦY do đơn hàng không hợp lệ hoặc đã hoàn tiền.');
      }

      // Mark ticket as used
      await connection.query("UPDATE tickets SET status = 'used' WHERE id = ?", [ticket.id]);

      // Record checkin log
      await connection.query(
        `INSERT INTO ticket_checkins (ticket_id, staff_id, checkin_time, notes) 
         VALUES (?, ?, NOW(), ?)`,
        [ticket.id, staffId, notes || 'Soát vé thành công tại cổng soát vé']
      );

      await connection.commit();

      return {
        success: true,
        ticket_code: ticket.ticket_code,
        movie_or_event: ticket.movie_title || ticket.event_title,
        seat: ticket.seat_row ? `${ticket.seat_row}${ticket.seat_number}` : ticket.ticket_type_name,
        customer_name: ticket.customer_name,
        checkin_time: new Date().toISOString(),
        message: 'Xác nhận soát vé THÀNH CÔNG!'
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async getRecentCheckins(limit = 20) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT tc.*, 
              t.ticket_code, 
              b.booking_code,
              u.full_name as customer_name,
              staff.full_name as staff_name,
              COALESCE(m.title, e.title) as title,
              COALESCE(CONCAT(s.seat_row, s.seat_number), tt.name) as seat_or_type
       FROM ticket_checkins tc
       JOIN tickets t ON tc.ticket_id = t.id
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN users staff ON tc.staff_id = staff.id
       JOIN booking_items bi ON t.booking_item_id = bi.id
       LEFT JOIN seats s ON bi.seat_id = s.id
       LEFT JOIN ticket_types tt ON bi.ticket_type_id = tt.id
       LEFT JOIN showtimes st ON b.showtime_id = st.id
       LEFT JOIN movies m ON st.movie_id = m.id
       LEFT JOIN events e ON b.event_id = e.id
       ORDER BY tc.checkin_time DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
};

module.exports = TicketModel;
