// ─────────────────────────────────────────────────────────
// db.js — MySQL Database Connection Pool
// Creates and exports a reusable connection pool so every
// controller can query the database without opening a new
// connection each time.
// ─────────────────────────────────────────────────────────

const mysql = require('mysql2/promise');
require('dotenv').config(); // Read DB credentials from .env file

// Create a connection pool — allows multiple queries at once
// without waiting for a single connection to be free
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',   // Database server address (default: localhost)
  user: process.env.DB_USER || 'root',         // MySQL username
  password: process.env.DB_PASSWORD || '',     // MySQL password
  database: process.env.DB_NAME || 'timetable_management', // Database name
  waitForConnections: true,   // Queue requests if all connections are busy
  connectionLimit: 10,        // Maximum number of simultaneous connections
  queueLimit: 0               // 0 means unlimited queued requests
});

module.exports = pool; // Share the pool with all controllers
