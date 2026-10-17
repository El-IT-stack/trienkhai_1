const { getPool } = require('../config/database');

const UserModel = {
  async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, u.full_name, u.email, u.phone, u.avatar_url, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ fullName, email, passwordHash, phone, roleId = 4 }) {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, phone, roleId]
    );
    return result.insertId;
  },

  async getAll() {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, u.full_name, u.email, u.phone, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.id DESC`
    );
    return rows;
  },

  async updateRole(id, roleId) {
    const pool = getPool();
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, id]);
  },

  async updateStatus(id, status) {
    const pool = getPool();
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  },

  async logAudit(userId, action, module, description, ipAddress = '127.0.0.1') {
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, ip_address) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId || null, action, module, description, ipAddress]
      );
    } catch (err) {
      // Non-blocking audit failure
      console.error('Audit log failed:', err.message);
    }
  }
};

module.exports = UserModel;
