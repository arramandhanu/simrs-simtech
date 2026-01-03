const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Test connection
promisePool.getConnection()
  .then(conn => {
    console.log(`Connected to MySQL DB: ${process.env.DB_NAME} on port ${process.env.DB_PORT}`);
    conn.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
  });

module.exports = promisePool;
