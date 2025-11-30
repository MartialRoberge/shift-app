-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum pour les rôles (IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('worker', 'employer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum pour le statut des shifts (IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('proposed', 'validated', 'disputed', 'paid', 'refused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    xrpl_address TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table work_sessions
CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    raw_audio_start_url TEXT,
    raw_audio_end_url TEXT,
    stt_start_text TEXT,
    stt_end_text TEXT,
    llm_structured_json JSONB,
    hours NUMERIC(10, 2),
    hourly_rate NUMERIC(10, 2),
    amount_total NUMERIC(10, 2),
    status shift_status DEFAULT 'proposed',
    xrpl_proposal_tx TEXT,
    xrpl_nft_id TEXT,
    xrpl_escrow_tx TEXT,
    xrpl_payment_tx TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_work_sessions_worker ON work_sessions(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_employer ON work_sessions(employer_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions(status);
CREATE INDEX IF NOT EXISTS idx_work_sessions_created ON work_sessions(created_at);

