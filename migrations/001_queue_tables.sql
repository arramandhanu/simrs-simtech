-- Queue Voice Manager: Database Migration
-- Run this SQL against the PostgreSQL database to create the required tables.

-- Departments / Clinics
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Counters / Loket
CREATE TABLE IF NOT EXISTS counters (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    operator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'inactive',  -- active, inactive, paused
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, code)
);

-- Queue Items
CREATE TABLE IF NOT EXISTS queue_items (
    id SERIAL PRIMARY KEY,
    queue_number VARCHAR(10) NOT NULL,
    patient_name VARCHAR(100),
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    counter_id INTEGER REFERENCES counters(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'normal',  -- normal, elderly, emergency
    status VARCHAR(20) DEFAULT 'waiting',   -- waiting, called, serving, completed, skipped
    called_at TIMESTAMP,
    served_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast queue lookups
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_department ON queue_items(department_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_created ON queue_items(created_at);

-- Voice Templates
CREATE TABLE IF NOT EXISTS voice_templates (
    id SERIAL PRIMARY KEY,
    language VARCHAR(10) DEFAULT 'id',
    template_text TEXT NOT NULL,
    description VARCHAR(200),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinic Schedule
CREATE TABLE IF NOT EXISTS clinic_schedules (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME,
    close_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, day_of_week)
);

-- Seed default voice templates (only if none exist)
INSERT INTO voice_templates (language, template_text, description, is_default)
SELECT 'id', 'Nomor antrian {{queue_number}}, silakan menuju {{counter_name}}.', 'Template panggilan bahasa Indonesia', true
WHERE NOT EXISTS (SELECT 1 FROM voice_templates WHERE language = 'id' AND is_default = true);

INSERT INTO voice_templates (language, template_text, description, is_default)
SELECT 'en', 'Queue number {{queue_number}}, please proceed to {{counter_name}}.', 'English call template', false
WHERE NOT EXISTS (SELECT 1 FROM voice_templates WHERE language = 'en');
