# PostgreSQL Database Setup Guide

Complete guide for setting up PostgreSQL database for SIMRS-SIMTECH application.

---

## Prerequisites

- PostgreSQL 15+ installed and running
- Access to `postgres` superuser account
- `psql` command-line tool

---

## Step 1: Connect to PostgreSQL

```bash
# Option A: Local connection
sudo -u postgres psql

# Option B: Remote connection
psql -h your-server-ip -U postgres -d postgres
```

---

## Step 2: Create Database

```sql
-- Create the database
CREATE DATABASE simrs_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Verify database was created
\l
```

---

## Step 3: Create Application User

```sql
-- Create a dedicated user for the application
-- Replace 'YOUR_SECURE_PASSWORD' with a strong password
CREATE USER simrs_app WITH 
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOINHERIT
    NOREPLICATION
    PASSWORD 'YOUR_SECURE_PASSWORD';

-- Verify user was created
\du
```

---

## Step 4: Grant Permissions

```sql
-- Connect to the simrs_db database first
\c simrs_db

-- Grant connection privilege
GRANT CONNECT ON DATABASE simrs_db TO simrs_app;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO simrs_app;

-- Grant all privileges on all tables (current)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO simrs_app;

-- Grant all privileges on all sequences (for auto-increment IDs)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO simrs_app;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO simrs_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO simrs_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO simrs_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON FUNCTIONS TO simrs_app;
```

---

## Step 5: Initialize Schema

Run the `init.sql` script to create tables:

```bash
# Option A: From command line
psql -h your-server-ip -U simrs_app -d simrs_db -f init.sql

# Option B: From psql prompt
\c simrs_db
\i /path/to/init.sql
```

Or manually execute in psql:

```sql
\c simrs_db

-- Users table
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
```

---

## Step 6: Verify Setup

```sql
-- Connect as app user
\c simrs_db simrs_app

-- Check tables
\dt

-- You should see:
--  Schema |       Name        | Type  |  Owner
-- --------+-------------------+-------+----------
--  public | dokter            | table | simrs_app
--  public | dokter_spesialis  | table | simrs_app
--  public | patients          | table | simrs_app
--  public | spesialis         | table | simrs_app
--  public | users             | table | simrs_app

-- Check permissions
\dp users
```

---

## Step 7: Configure Application

Update your `.env` file with the database credentials:

```bash
DB_HOST=your-server-ip
DB_PORT=5432
DB_USER=simrs_app
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=simrs_db
```

---

## Optional: Configure Remote Access

If your application runs on a different server, configure PostgreSQL for remote access:

### 1. Edit postgresql.conf

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Find and update:
```
listen_addresses = '*'
```

### 2. Edit pg_hba.conf

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Add at the end (replace `your-app-server-ip` with actual IP):
```
# Allow simrs_app from application server
host    simrs_db    simrs_app    your-app-server-ip/32    scram-sha-256

# Or allow from any IP (less secure)
host    simrs_db    simrs_app    0.0.0.0/0    scram-sha-256
```

### 3. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

### 4. Configure Firewall

```bash
# UFW
sudo ufw allow from your-app-server-ip to any port 5432

# Or firewalld
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="your-app-server-ip" port port="5432" protocol="tcp" accept'
sudo firewall-cmd --reload
```

---

## Keycloak Database Setup (Optional)

If you're using Keycloak SSO, you need a separate database for Keycloak.

### Create Keycloak Database and User

```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create Keycloak user
CREATE USER keycloak WITH PASSWORD 'Keycloak123!';

-- Create Keycloak database
CREATE DATABASE keycloak OWNER keycloak;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;

-- Connect to keycloak database and grant schema permissions
\c keycloak
GRANT ALL ON SCHEMA public TO keycloak;
```

### Verify Connection

```bash
psql -h localhost -U keycloak -d keycloak -c "SELECT 1"
```

---

## Troubleshooting

### Connection refused
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Check `listen_addresses` in `postgresql.conf`
- Check firewall rules

### Permission denied
- Verify user has correct grants: `\dp table_name`
- Re-run the GRANT statements

### Authentication failed
- Check password in `.env` matches what was set
- Check `pg_hba.conf` allows your connection method
