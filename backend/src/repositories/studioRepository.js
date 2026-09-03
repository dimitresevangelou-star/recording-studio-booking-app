const pool = require('../config/db');

class StudioRepository {
  async create({ name, description, location, hourlyRate, engineerId }) {
    const result = await pool.query(
      `INSERT INTO studios (name, description, location, hourly_rate, engineer_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, location, hourlyRate, engineerId]
    );
    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(
      `SELECT s.*, u.full_name AS engineer_name
       FROM studios s JOIN users u ON s.engineer_id = u.id
       ORDER BY s.created_at DESC`
    );
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM studios WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async update(id, { name, description, location, hourlyRate }) {
    const result = await pool.query(
      `UPDATE studios SET name = $1, description = $2, location = $3,
       hourly_rate = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [name, description, location, hourlyRate, id]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await pool.query('DELETE FROM studios WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }
}

module.exports = new StudioRepository();
