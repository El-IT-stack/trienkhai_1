const { getPool } = require('../config/database');

const StatsModel = {
  async getOverview() {
    const pool = getPool();

    // 1. Total revenue
    const [rev] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM bookings WHERE status = 'confirmed'"
    );

    // 2. Total bookings count
    const [bkCount] = await pool.query(
      "SELECT COUNT(*) as total_bookings, " +
      "SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings, " +
      "SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings, " +
      "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings FROM bookings"
    );

    // 3. Total tickets sold
    const [tckCount] = await pool.query(
      "SELECT COUNT(*) as total_tickets, " +
      "SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_tickets, " +
      "SUM(CASE WHEN status = 'valid' THEN 1 ELSE 0 END) as valid_tickets FROM tickets"
    );

    // 4. Total users
    const [userCount] = await pool.query(
      "SELECT COUNT(*) as total_users FROM users"
    );

    // 5. Total movies and events
    const [itemCount] = await pool.query(
      "SELECT (SELECT COUNT(*) FROM movies) as total_movies, (SELECT COUNT(*) FROM events) as total_events"
    );

    return {
      revenue: parseFloat(rev[0].total_revenue),
      bookings: bkCount[0],
      tickets: tckCount[0],
      users: userCount[0].total_users,
      catalog: itemCount[0]
    };
  },

  async getRevenueByMovies() {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT m.id, m.title, m.poster_url,
              COUNT(DISTINCT b.id) as total_bookings,
              COUNT(t.id) as total_tickets_sold,
              COALESCE(SUM(bi.subtotal), 0) as total_revenue
       FROM movies m
       JOIN showtimes s ON s.movie_id = m.id
       JOIN bookings b ON b.showtime_id = s.id AND b.status = 'confirmed'
       JOIN booking_items bi ON bi.booking_id = b.id
       LEFT JOIN tickets t ON t.booking_item_id = bi.id
       GROUP BY m.id, m.title, m.poster_url
       ORDER BY total_revenue DESC`
    );
    return rows;
  },

  async getRevenueByEvents() {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT e.id, e.title, e.banner_url, e.venue_name,
              COUNT(DISTINCT b.id) as total_bookings,
              COALESCE(SUM(bi.quantity), 0) as total_tickets_sold,
              COALESCE(SUM(bi.subtotal), 0) as total_revenue
       FROM events e
       JOIN bookings b ON b.event_id = e.id AND b.status = 'confirmed'
       JOIN booking_items bi ON bi.booking_id = b.id
       GROUP BY e.id, e.title, e.banner_url, e.venue_name
       ORDER BY total_revenue DESC`
    );
    return rows;
  },

  async getAuditLogs(limit = 50) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT a.*, u.full_name, u.email, r.name as role_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
};

module.exports = StatsModel;
