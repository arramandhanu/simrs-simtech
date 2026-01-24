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
