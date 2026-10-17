const { getPool } = require('../config/database');

const CinemaModel = {
  async getAll() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM cinemas ORDER BY city ASC, name ASC');
    return rows;
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM cinemas WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getRoomsByCinemaId(cinemaId) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM rooms WHERE cinema_id = ? ORDER BY name ASC',
      [cinemaId]
    );
    return rows;
  },

  async getSeatsByRoomId(roomId) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM seats WHERE room_id = ? ORDER BY seat_row ASC, seat_number ASC',
      [roomId]
    );
    return rows;
  }
};

module.exports = CinemaModel;
