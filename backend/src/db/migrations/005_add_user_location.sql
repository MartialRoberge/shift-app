-- Migration 005: Add location fields to users for agency map
-- Created: 2024-01-15

-- Add location columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'France';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing demo users with location data
UPDATE users SET city = 'Paris', country = 'France' WHERE name = 'Jean Dupont' AND city IS NULL;
UPDATE users SET city = 'Lyon', country = 'France' WHERE name = 'Marie Martin' AND city IS NULL;
UPDATE users SET city = 'Marseille', country = 'France' WHERE name = 'Pierre Bernard' AND city IS NULL;
UPDATE users SET city = 'Paris', country = 'France' WHERE name = 'Sophie Durand' AND city IS NULL;
UPDATE users SET city = 'Bordeaux', country = 'France' WHERE name = 'Lucas Petit' AND city IS NULL;

-- Update employers with location data
UPDATE users SET city = 'Paris', country = 'France' WHERE name = 'Tech Corp' AND city IS NULL;
UPDATE users SET city = 'Lyon', country = 'France' WHERE name = 'Build Pro' AND city IS NULL;
UPDATE users SET city = 'Paris', country = 'France' WHERE name = 'Clean Services' AND city IS NULL;

-- Set default for remaining users
UPDATE users SET city = 'Paris', country = 'France' WHERE city IS NULL;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
