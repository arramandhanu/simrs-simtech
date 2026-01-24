-- ==============================================
-- SIMRS-SIMTECH Database Initialization Script
-- ==============================================
-- Run this script to create the database schema
-- Usage: psql -U simrs_app -d simrs_db -f init.sql

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    position VARCHAR(100),
    keycloak_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    approved_at TIMESTAMP,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    no_rme VARCHAR(50) UNIQUE,
    nama_lengkap VARCHAR(255) NOT NULL,
    jenis_kelamin VARCHAR(20),
    tanggal_lahir DATE,
    no_telp VARCHAR(50),
    alamat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS dokter (
    id SERIAL PRIMARY KEY,
    kode_dokter VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    gelar_depan VARCHAR(50),
    gelar_belakang VARCHAR(50),
    jenis_kelamin VARCHAR(20),
    tanggal_lahir DATE,
    no_hp VARCHAR(50),
    email VARCHAR(255),
    alamat TEXT,
    status VARCHAR(50) DEFAULT 'AKTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specializations table
CREATE TABLE IF NOT EXISTS spesialis (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL
);

-- Doctor-Specialization junction table
CREATE TABLE IF NOT EXISTS dokter_spesialis (
    id SERIAL PRIMARY KEY,
    dokter_id INTEGER REFERENCES dokter(id) ON DELETE CASCADE,
    spesialis_id INTEGER REFERENCES spesialis(id) ON DELETE CASCADE,
    is_utama BOOLEAN DEFAULT FALSE,
    UNIQUE(dokter_id, spesialis_id)
);

-- ==============================================
-- Seed Data
-- ==============================================
-- NOTE: Create admin user via API: POST /api/auth/register

-- Medical specializations
INSERT INTO spesialis (kode, nama) VALUES
    ('UM', 'Umum'),
    ('PD', 'Penyakit Dalam'),
    ('AN', 'Anak'),
    ('OB', 'Obstetri & Ginekologi'),
    ('BD', 'Bedah Umum'),
    ('JP', 'Jantung & Pembuluh Darah'),
    ('SP', 'Saraf'),
    ('OR', 'Orthopedi'),
    ('KK', 'Kulit & Kelamin'),
    ('MT', 'Mata'),
    ('THT', 'Telinga Hidung Tenggorokan')
ON CONFLICT (kode) DO NOTHING;

-- ==============================================
-- User Settings table
-- ==============================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'id',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    compact_mode BOOLEAN DEFAULT FALSE,
    settings_json JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- Hospital Settings table (system-wide)
-- ==============================================
CREATE TABLE IF NOT EXISTS hospital_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default hospital settings
INSERT INTO hospital_settings (setting_key, setting_value, setting_type, description) VALUES
    ('hospital_name', 'SIMRS SIMTECH', 'string', 'Hospital display name'),
    ('hospital_address', '', 'string', 'Hospital address'),
    ('hospital_phone', '', 'string', 'Hospital phone number'),
    ('hospital_email', '', 'string', 'Hospital contact email'),
    ('hospital_logo', '', 'string', 'Hospital logo URL'),
    ('session_timeout_minutes', '60', 'number', 'Auto-logout after inactivity'),
    ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
    ('default_language', 'id', 'string', 'Default system language'),
    ('date_format', 'DD/MM/YYYY', 'string', 'Date display format'),
    ('time_format', 'HH:mm', 'string', 'Time display format')
ON CONFLICT (setting_key) DO NOTHING;

-- ==============================================
-- Notifications table
-- ==============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
