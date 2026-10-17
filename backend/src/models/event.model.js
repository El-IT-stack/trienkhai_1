const { getPool } = require('../config/database');

const EventModel = {
  async getAll({ status, search } = {}) {
    const pool = getPool();
    let query = `
      SELECT e.*, 
        (SELECT MIN(price) FROM ticket_types WHERE event_id = e.id) as min_price,
        (SELECT MAX(price) FROM ticket_types WHERE event_id = e.id) as max_price
      FROM events e 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (e.title LIKE ? OR e.venue_name LIKE ? OR e.organizer LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY e.start_time ASC, e.id DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getBySlug(slug) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM events WHERE slug = ?', [slug]);
    return rows[0] || null;
  },

  async getTicketTypes(eventId) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM ticket_types WHERE event_id = ? ORDER BY price ASC',
      [eventId]
    );
    return rows;
  },

  async create(data) {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO events 
       (title, slug, category, organizer, start_time, end_time, banner_url, description, venue_name, venue_address, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.slug,
        data.category || 'Âm nhạc & Nghệ thuật',
        data.organizer,
        data.start_time,
        data.end_time,
        data.banner_url || '',
        data.description || '',
        data.venue_name,
        data.venue_address,
        data.status || 'upcoming'
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const pool = getPool();
    await pool.query(
      `UPDATE events SET 
       title = ?, slug = ?, category = ?, organizer = ?, start_time = ?, 
       end_time = ?, banner_url = ?, description = ?, venue_name = ?, 
       venue_address = ?, status = ? 
       WHERE id = ?`,
      [
        data.title,
        data.slug,
        data.category,
        data.organizer,
        data.start_time,
        data.end_time,
        data.banner_url,
        data.description,
        data.venue_name,
        data.venue_address,
        data.status,
        id
      ]
    );
  },

  async delete(id) {
    const pool = getPool();
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
  }
};

module.exports = EventModel;
