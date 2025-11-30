-- Migration: Add missions table for job postings
-- This allows employers to create job listings that workers can apply to

-- Enum pour le statut des missions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_status') THEN
        CREATE TYPE mission_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
    END IF;
END$$;

-- Enum pour le statut des candidatures
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
    END IF;
END$$;

-- Table missions (job postings)
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    address TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    total_hours_needed NUMERIC(10, 2) NOT NULL DEFAULT 100,
    hours_completed NUMERIC(10, 2) DEFAULT 0,
    requirements TEXT[], -- Array of requirements
    status mission_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table mission_applications (worker applications to missions)
CREATE TABLE IF NOT EXISTS mission_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status application_status DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(mission_id, worker_id) -- Worker can only apply once per mission
);

-- Table mission_workers (accepted workers on a mission)
CREATE TABLE IF NOT EXISTS mission_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours_worked NUMERIC(10, 2) DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mission_id, worker_id)
);

-- Add mission_id to work_sessions to link shifts to missions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'work_sessions' AND column_name = 'mission_id'
    ) THEN
        ALTER TABLE work_sessions ADD COLUMN mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;
    END IF;
END$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_missions_employer ON missions(employer_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_mission_applications_mission ON mission_applications(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_applications_worker ON mission_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_mission_workers_mission ON mission_workers(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_workers_worker ON mission_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_mission ON work_sessions(mission_id);
