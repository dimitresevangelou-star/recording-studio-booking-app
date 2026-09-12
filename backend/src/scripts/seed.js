/**
 * Seed script — populates the database with sample data so the app can be
 * demoed immediately without manual registration.
 *
 * Usage: npm run seed   (run this AFTER the DB schema has been created)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Users ---------------------------------------------------------
  const engineerResult = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'engineer')
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING id`,
    ['Nikos Engineer', 'engineer@example.com', passwordHash]
  );
  const engineerId = engineerResult.rows[0].id;

  const artistResult = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'artist')
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING id`,
    ['Maria Artist', 'artist@example.com', passwordHash]
  );
  const artistId = artistResult.rows[0].id;

  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name`,
    ['Admin User', 'admin@example.com', passwordHash]
  );

  // --- Studios (idempotent: reuse existing row for this name+engineer instead
  // of inserting a duplicate if the seed script is run more than once) -------
  async function findOrCreateStudio({ name, description, location, hourlyRate }) {
    const existing = await pool.query(
      'SELECT id FROM studios WHERE name = $1 AND engineer_id = $2',
      [name, engineerId]
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const inserted = await pool.query(
      `INSERT INTO studios (name, description, location, hourly_rate, engineer_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, description, location, hourlyRate, engineerId]
    );
    return inserted.rows[0].id;
  }

  const studio1Id = await findOrCreateStudio({
    name: 'Sunset Sound Studio',
    description: 'A cozy analog studio with vintage gear, great for warm vocal takes.',
    location: 'Athens, Greece',
    hourlyRate: 35.0,
  });

  await findOrCreateStudio({
    name: 'Digital Loft',
    description: 'Modern production suite, ideal for mixing and electronic music.',
    location: 'Thessaloniki, Greece',
    hourlyRate: 50.0,
  });

  // --- A sample booking (idempotent: skip if this artist already has a demo
  // booking on studio1 from a previous seed run) -----------------------------
  const existingBooking = await pool.query(
    'SELECT id FROM bookings WHERE studio_id = $1 AND artist_id = $2',
    [studio1Id, artistId]
  );

  if (!existingBooking.rows[0]) {
    const start = new Date();
    start.setDate(start.getDate() + 2);
    start.setHours(14, 0, 0, 0);
    const end = new Date(start);
    end.setHours(16, 0, 0, 0);

    await pool.query(
      `INSERT INTO bookings (studio_id, artist_id, start_time, end_time, status, total_price)
       VALUES ($1, $2, $3, $4, 'confirmed', $5)`,
      [studio1Id, artistId, start, end, 70.0]
    );
  }

  console.log('Seed complete!');
  console.log('---------------------------------------------');
  console.log('Sample login credentials (password for all: password123)');
  console.log('  Engineer: engineer@example.com');
  console.log('  Artist:   artist@example.com');
  console.log('  Admin:    admin@example.com');
  console.log('---------------------------------------------');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
