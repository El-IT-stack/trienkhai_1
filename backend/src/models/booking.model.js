const { getPool } = require('../config/database');

const BookingModel = {
  async createMovieBooking({ userId, showtimeId, seatItems, totalAmount }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Check if any selected seats are already booked
      const seatIds = seatItems.map(item => item.seat_id);
      const [existing] = await connection.query(
        `SELECT bi.seat_id, s.seat_row, s.seat_number 
         FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         JOIN seats s ON bi.seat_id = s.id
         WHERE b.showtime_id = ? 
           AND bi.seat_id IN (?)
           AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.expires_at > NOW()))
         FOR UPDATE`,
        [showtimeId, seatIds]
      );

      if (existing.length > 0) {
        const bookedSeatNames = existing.map(s => `${s.seat_row}${s.seat_number}`).join(', ');
        throw new Error(`Rất tiếc! Ghế ${bookedSeatNames} vừa được người khác chọn. Vui lòng chọn ghế khác.`);
      }

      // 2. Generate unique booking code
      const bookingCode = 'BK-MOV-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

      // 3. Insert Booking (valid for 15 minutes)
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings 
         (booking_code, user_id, booking_type, showtime_id, total_amount, status, expires_at) 
         VALUES (?, ?, 'movie', ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
        [bookingCode, userId, showtimeId, totalAmount]
      );
      const bookingId = bookingResult.insertId;

      // 4. Insert Booking Items
      for (const item of seatItems) {
        await connection.query(
          `INSERT INTO booking_items (booking_id, seat_id, quantity, unit_price, subtotal) 
           VALUES (?, ?, 1, ?, ?)`,
          [bookingId, item.seat_id, item.unit_price, item.unit_price]
        );
      }

      await connection.commit();
      return { bookingId, bookingCode };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async createEventBooking({ userId, eventId, ticketItems, totalAmount }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Check availability for each ticket type
      for (const item of ticketItems) {
        const [types] = await connection.query(
          'SELECT * FROM ticket_types WHERE id = ? FOR UPDATE',
          [item.ticket_type_id]
        );
        if (types.length === 0) {
          throw new Error(`Loại vé mã ${item.ticket_type_id} không tồn tại.`);
        }
        const ticketType = types[0];
        if (ticketType.sold_quantity + item.quantity > ticketType.total_quantity) {
          throw new Error(`Loại vé '${ticketType.name}' không còn đủ số lượng yêu cầu (còn lại: ${ticketType.total_quantity - ticketType.sold_quantity}).`);
        }
      }

      // 2. Generate unique booking code
      const bookingCode = 'BK-EVT-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

      // 3. Insert Booking
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings 
         (booking_code, user_id, booking_type, event_id, total_amount, status, expires_at) 
         VALUES (?, ?, 'event', ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
        [bookingCode, userId, eventId, totalAmount]
      );
      const bookingId = bookingResult.insertId;

      // 4. Insert items and update sold_quantity
      for (const item of ticketItems) {
        await connection.query(
          `INSERT INTO booking_items (booking_id, ticket_type_id, quantity, unit_price, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [bookingId, item.ticket_type_id, item.quantity, item.unit_price, item.subtotal]
        );

        await connection.query(
          'UPDATE ticket_types SET sold_quantity = sold_quantity + ? WHERE id = ?',
          [item.quantity, item.ticket_type_id]
        );
      }

      await connection.commit();
      return { bookingId, bookingCode };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT b.*, 
              u.full_name as user_name, u.email as user_email, u.phone as user_phone,
              m.title as movie_title, m.poster_url as movie_poster,
              e.title as event_title, e.banner_url as event_banner,
              s.start_time as showtime_start,
              r.name as room_name,
              c.name as cinema_name,
              p.status as payment_status, p.payment_method, p.transaction_code
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN showtimes s ON b.showtime_id = s.id
       LEFT JOIN movies m ON s.movie_id = m.id
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN cinemas c ON r.cinema_id = c.id
       LEFT JOIN events e ON b.event_id = e.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const booking = rows[0];

    // Get items
    const [items] = await pool.query(
      `SELECT bi.*, 
              s.seat_row, s.seat_number, s.seat_type,
              tt.name as ticket_type_name
       FROM booking_items bi
       LEFT JOIN seats s ON bi.seat_id = s.id
       LEFT JOIN ticket_types tt ON bi.ticket_type_id = tt.id
       WHERE bi.booking_id = ?`,
      [id]
    );
    booking.items = items;

    // Get tickets if confirmed
    const [tickets] = await pool.query(
      `SELECT t.*, tc.checkin_time, tc.notes as checkin_notes 
       FROM tickets t 
       LEFT JOIN ticket_checkins tc ON tc.ticket_id = t.id
       WHERE t.booking_id = ?`,
      [id]
    );
    booking.tickets = tickets;

    return booking;
  },

  async getByCode(code) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id FROM bookings WHERE booking_code = ?', [code]);
    if (rows.length === 0) return null;
    return this.getById(rows[0].id);
  },

  async getByUserId(userId) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT b.*, 
              m.title as movie_title, m.poster_url as movie_poster,
              e.title as event_title, e.banner_url as event_banner,
              s.start_time as showtime_start,
              c.name as cinema_name,
              (SELECT COUNT(*) FROM tickets WHERE booking_id = b.id) as ticket_count
       FROM bookings b
       LEFT JOIN showtimes s ON b.showtime_id = s.id
       LEFT JOIN movies m ON s.movie_id = m.id
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN cinemas c ON r.cinema_id = c.id
       LEFT JOIN events e ON b.event_id = e.id
       WHERE b.user_id = ?
       ORDER BY b.id DESC`,
      [userId]
    );
    return rows;
  },

  async getAll({ status, search, type } = {}) {
    const pool = getPool();
    let query = `
      SELECT b.*, 
             u.full_name as user_name, u.email as user_email, u.phone as user_phone,
             m.title as movie_title,
             e.title as event_title,
             s.start_time as showtime_start,
             p.status as payment_status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN showtimes s ON b.showtime_id = s.id
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    if (type) {
      query += ` AND b.booking_type = ?`;
      params.push(type);
    }
    if (search) {
      query += ` AND (b.booking_code LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY b.id DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async updateStatus(bookingId, status) {
    const pool = getPool();
    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
  }
};

module.exports = BookingModel;
