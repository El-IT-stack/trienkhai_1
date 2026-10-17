const { getPool } = require('../config/database');

const ShowtimeModel = {
  async getAll(date = null) {
    const pool = getPool();
    let query = `
      SELECT s.*, 
             r.name as room_name, r.screen_type,
             c.id as cinema_id, c.name as cinema_name, c.city as cinema_city, c.address as cinema_address,
             m.title as movie_title, m.duration, m.poster_url, m.age_rating
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN cinemas c ON r.cinema_id = c.id
      JOIN movies m ON s.movie_id = m.id
    `;
    const params = [];
    if (date) {
      query += ` WHERE DATE(s.start_time) = ?`;
      params.push(date);
    }
    query += ` ORDER BY s.start_time ASC`;
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async getByMovieId(movieId, date = null) {
    const pool = getPool();
    let query = `
      SELECT s.*, 
             r.name as room_name, r.screen_type,
             c.id as cinema_id, c.name as cinema_name, c.city as cinema_city, c.address as cinema_address,
             m.title as movie_title, m.duration, m.poster_url, m.age_rating
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN cinemas c ON r.cinema_id = c.id
      JOIN movies m ON s.movie_id = m.id
      WHERE s.movie_id = ?
    `;
    const params = [movieId];

    if (date) {
      query += ` AND DATE(s.start_time) = ?`;
      params.push(date);
    } else {
      query += ` AND s.start_time >= NOW()`;
    }

    query += ` ORDER BY s.start_time ASC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT s.*, 
              r.name as room_name, r.screen_type, r.total_seats,
              c.id as cinema_id, c.name as cinema_name, c.city as cinema_city, c.address as cinema_address,
              m.id as movie_id, m.title as movie_title, m.duration, m.poster_url, m.age_rating
       FROM showtimes s
       JOIN rooms r ON s.room_id = r.id
       JOIN cinemas c ON r.cinema_id = c.id
       JOIN movies m ON s.movie_id = m.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async getSeatsWithStatus(showtimeId) {
    const pool = getPool();
    
    // First get showtime to know which room it's in
    const showtime = await this.getById(showtimeId);
    if (!showtime) return [];

    // Query all seats in this room and check if seat is booked
    const [seats] = await pool.query(
      `SELECT s.id, s.room_id, s.seat_row, s.seat_number, s.seat_type, s.status as seat_status,
              CASE 
                WHEN bk_items.id IS NOT NULL THEN 1 
                ELSE 0 
              END as is_booked
       FROM seats s
       LEFT JOIN (
         SELECT bi.seat_id, bi.id
         FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.showtime_id = ? 
           AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.expires_at > NOW()))
       ) bk_items ON s.id = bk_items.seat_id
       WHERE s.room_id = ?
       ORDER BY s.seat_row ASC, s.seat_number ASC`,
      [showtimeId, showtime.room_id]
    );

    return seats;
  },

  async create(data) {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price_standard, price_vip, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.movie_id,
        data.room_id,
        data.start_time,
        data.end_time,
        data.price_standard,
        data.price_vip,
        data.status || 'scheduled'
      ]
    );
    return result.insertId;
  },

  async delete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM showtimes WHERE id = ?', [id]);
  }
};

module.exports = ShowtimeModel;
