-- ============================================================
-- Studio Session Booking App - Domain Model / DB Schema
-- Entities: User, Studio, Booking
-- ============================================================

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS studios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USER (Value: identity + role -> Artist, Engineer, Admin)
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'artist'
                        CHECK (role IN ('artist', 'engineer', 'admin')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STUDIO (owned/operated by an engineer user)
-- ============================================================
CREATE TABLE studios (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    location        VARCHAR(200),
    hourly_rate     NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    engineer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING (an artist books a studio for a time slot)
-- ============================================================
CREATE TABLE bookings (
    id              SERIAL PRIMARY KEY,
    studio_id       INTEGER NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    artist_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price     NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_studios_engineer ON studios(engineer_id);
CREATE INDEX idx_bookings_studio ON bookings(studio_id);
CREATE INDEX idx_bookings_artist ON bookings(artist_id);
CREATE INDEX idx_bookings_status ON bookings(status);
