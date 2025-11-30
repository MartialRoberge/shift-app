-- Migration: Add geolocation columns to work_sessions
-- This enables tracking worker location at check-in and check-out

-- Add start geolocation columns
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS start_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS start_longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS start_location_accuracy NUMERIC(10, 2);

-- Add end geolocation columns
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS end_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS end_longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS end_location_accuracy NUMERIC(10, 2);

-- Add geolocation verification result
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS geo_verification JSONB;

-- Add mission_id if it doesn't exist
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;

-- Create index for geo queries (useful for location-based searches)
CREATE INDEX IF NOT EXISTS idx_work_sessions_location ON work_sessions(start_latitude, start_longitude);
