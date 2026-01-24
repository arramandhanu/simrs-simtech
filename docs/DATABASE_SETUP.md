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

### Option A: Fresh Database (New Install)

Run the `init.sql` script to create tables:

```bash
# Using postgres superuser (recommended for servers)
sudo -u postgres psql -d simrs_db -f init.sql

# Or with password auth
psql -h localhost -U simrs_app -d simrs_db -f init.sql
```

### Option B: Existing Database (Migration for User Approval Feature)

If tables already exist, run the migration to add user approval columns:

```bash
sudo -u postgres psql -d simrs_db -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
UPDATE users SET status = 'approved' WHERE status IS NULL OR status = '';
"
```

---

## Current Users Table Schema

As of `feature/user-management` branch:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),                    -- NULLABLE for SSO users
    role VARCHAR(50) DEFAULT 'user',
    position VARCHAR(100),
    keycloak_id VARCHAR(255) UNIQUE,          -- Links to Keycloak user UUID
    status VARCHAR(50) DEFAULT 'pending',     -- pending, approved, rejected, suspended
    approved_at TIMESTAMP,                     -- When admin approved
    approved_by INTEGER REFERENCES users(id),  -- Admin who approved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Column Reference

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | auto | Primary key |
| `name` | VARCHAR(255) | YES | NULL | User's display name |
| `email` | VARCHAR(255) | NO | - | Unique email address |
| `password` | VARCHAR(255) | YES | NULL | Hashed password (NULL for SSO users) |
| `role` | VARCHAR(50) | NO | 'user' | admin, doctor, nurse, staff, readonly, user |
| `position` | VARCHAR(100) | YES | NULL | Job title/position |
| `keycloak_id` | VARCHAR(255) | YES | NULL | Keycloak user UUID (sub claim) |
| `status` | VARCHAR(50) | NO | 'pending' | User approval status |
| `approved_at` | TIMESTAMP | YES | NULL | When user was approved |
| `approved_by` | INTEGER | YES | NULL | FK to approving admin's user.id |
| `created_at` | TIMESTAMP | NO | NOW() | Record creation time |

---

## Step 6: Create First Admin User

After running init.sql or migration, approve your first admin:

```bash
# Replace with your actual email
sudo -u postgres psql -d simrs_db -c "UPDATE users SET status='approved', role='admin' WHERE email='your-admin@email.com';"
```

Or insert a new admin directly:

```bash
sudo -u postgres psql -d simrs_db -c "
INSERT INTO users (name, email, role, status, password) 
VALUES ('Administrator', 'admin@hospital.com', 'admin', 'approved', 
        '\$2a\$10\$YourHashedPasswordHere');
"
```

---

## Step 7: Verify Setup

```sql
-- Connect as postgres
sudo -u postgres psql -d simrs_db

-- Check tables
\dt

-- Check users table structure
\d users

-- View existing users
SELECT id, email, name, role, status, keycloak_id FROM users;

-- Check permissions
\dp users
```

Expected output for `\d users`:

```
                                         Table "public.users"
   Column    |            Type             | Collation | Nullable |              Default
-------------+-----------------------------+-----------+----------+-----------------------------------
 id          | integer                     |           | not null | nextval('users_id_seq'::regclass)
 name        | character varying(255)      |           |          |
 email       | character varying(255)      |           | not null |
 password    | character varying(255)      |           |          |
 role        | character varying(50)       |           |          | 'user'::character varying
 position    | character varying(100)      |           |          |
 created_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 keycloak_id | character varying(255)      |           |          |
 status      | character varying(50)       |           |          | 'pending'::character varying
 approved_at | timestamp without time zone |           |          |
 approved_by | integer                     |           |          |
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE CONSTRAINT, btree (email)
    "users_keycloak_id_key" UNIQUE CONSTRAINT, btree (keycloak_id)
Foreign-key constraints:
    "users_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES users(id)
```

---

## Step 8: Configure Application

Update your `.env` file with the database credentials:

```bash
DB_HOST=your-server-ip        # Or 'host.docker.internal' for Docker
DB_PORT=5432
DB_USER=simrs_app
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=simrs_db
```

---

## Common Operations

### Approve a Pending User

```bash
sudo -u postgres psql -d simrs_db -c "UPDATE users SET status='approved', role='doctor' WHERE email='user@email.com';"
```

### Reject a User

```bash
sudo -u postgres psql -d simrs_db -c "UPDATE users SET status='rejected' WHERE email='user@email.com';"
```

### Change User Role

```bash
sudo -u postgres psql -d simrs_db -c "UPDATE users SET role='admin' WHERE email='user@email.com';"
```

### View Pending Users

```bash
sudo -u postgres psql -d simrs_db -c "SELECT id, email, name, status FROM users WHERE status='pending';"
```

### Delete a User

```bash
sudo -u postgres psql -d simrs_db -c "DELETE FROM users WHERE email='user@email.com';"
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

### Peer authentication failed

```bash
# Use -h localhost to force TCP/IP instead of Unix socket
psql -h localhost -U simrs_app -d simrs_db

# Or use postgres superuser
sudo -u postgres psql -d simrs_db
```

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

### User status always 'pending'
- Existing users after migration may have NULL status
- Run: `UPDATE users SET status = 'approved' WHERE status IS NULL;`
