-- Migration: Add latitude and longitude to missions table
-- This enables GPS verification for worker check-in/check-out

-- Add latitude and longitude columns to missions table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'missions' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE missions ADD COLUMN latitude NUMERIC(10, 8);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'missions' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE missions ADD COLUMN longitude NUMERIC(11, 8);
    END IF;
END$$;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_missions_location ON missions(latitude, longitude);

-- Update seed data with coordinates for Paris area
UPDATE missions SET
    latitude = 48.8566,
    longitude = 2.3522
WHERE latitude IS NULL;
