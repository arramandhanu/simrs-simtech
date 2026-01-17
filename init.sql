-- Database Initialization Script inferred from Backend Code

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS spesialis (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS dokter_spesialis (
    id SERIAL PRIMARY KEY,
    dokter_id INTEGER REFERENCES dokter(id) ON DELETE CASCADE,
    spesialis_id INTEGER REFERENCES spesialis(id) ON DELETE CASCADE,
    is_utama BOOLEAN DEFAULT FALSE,
    UNIQUE(dokter_id, spesialis_id)
);

-- Seed some initial data if tables are empty
INSERT INTO users (name, email, password, role, position)
SELECT 'Admin', 'admin@simtech.id', '$2a$10$X7.1j1.1.1.1.1.1.1.1.1', 'admin', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@simtech.id');

INSERT INTO spesialis (kode, nama)
VALUES 
('UM', 'Umum'),
('PD', 'Penyakit Dalam'),
('AN', 'Anak'),
('OB', 'Obgyn'),
('BD', 'Bedah')
ON CONFLICT (kode) DO NOTHING;
