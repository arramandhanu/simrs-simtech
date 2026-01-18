# ==============================================
# SIMRS-SIMTECH Database Initialization Script
# ==============================================
# Generated from backend code analysis

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
-- Seed Data (Non-sensitive only)
-- ==============================================
-- NOTE: Create admin user via API after deployment
-- Use: POST /api/auth/register

-- Sample specializations
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

-- Sample doctors
INSERT INTO dokter (kode_dokter, nama, gelar_depan, gelar_belakang, jenis_kelamin, status) VALUES
    ('DKT001', 'Budi Santoso', 'dr.', 'Sp.PD', 'Laki-laki', 'AKTIF'),
    ('DKT002', 'Siti Rahayu', 'dr.', 'Sp.A', 'Perempuan', 'AKTIF'),
    ('DKT003', 'Ahmad Wijaya', 'dr.', 'Sp.B', 'Laki-laki', 'AKTIF')
ON CONFLICT (kode_dokter) DO NOTHING;

-- Sample patients
INSERT INTO patients (no_rme, nama_lengkap, jenis_kelamin, tanggal_lahir, no_telp, alamat) VALUES
    ('RME001', 'John Doe', 'Laki-laki', '1990-05-15', '08123456789', 'Jl. Contoh No. 1'),
    ('RME002', 'Jane Smith', 'Perempuan', '1985-08-22', '08198765432', 'Jl. Sample No. 2'),
    ('RME003', 'Bambang Suryono', 'Laki-laki', '1978-12-01', '08111222333', 'Jl. Test No. 3')
ON CONFLICT (no_rme) DO NOTHING;
