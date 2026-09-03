const pool = require('../config/db');

class BookingRepository {
  async create({ studioId, artistId, startTime, endTime, totalPrice }) {
    const result = await pool.query(
      `INSERT INTO bookings (studio_id, artist_id, start_time, end_time, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [studioId, artistId, startTime, endTime, totalPrice]
    );
    return result.rows[0];
  }

  async findOverlapping(studioId, startTime, endTime) {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE studio_id = $1 AND status != 'cancelled'
       AND start_time < $3 AND end_time > $2`,
      [studioId, startTime, endTime]
    );
    return result.rows;
  }

  async findByArtist(artistId) {
    const result = await pool.query(
      `SELECT b.*, s.name AS studio_name FROM bookings b
       JOIN studios s ON b.studio_id = s.id
       WHERE b.artist_id = $1 ORDER BY b.start_time DESC`,
      [artistId]
    );
    return result.rows;
  }

  async findAll() {
    const result = await pool.query(
      `SELECT b.*, s.name AS studio_name, u.full_name AS artist_name
       FROM bookings b
       JOIN studios s ON b.studio_id = s.id
       JOIN users u ON b.artist_id = u.id
       ORDER BY b.start_time DESC`
    );
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new BookingRepository();
