const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Support both connection string (DATABASE_URL) and individual params
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for Supabase
    })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: { rejectUnauthorized: false }
    });

// Test connection
pool.connect()
  .then(client => {
    console.log(`Connected to PostgreSQL DB: ${process.env.DB_NAME || 'Supabase'}`);
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err.message);
  });

module.exports = pool;

