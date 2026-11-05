const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.SQL_DATABASE_HOST,
  port: process.env.SQL_DATABASE_PORT,
  user: process.env.SQL_BACKEND_USER,
  password: process.env.SQL_BACKEND_PASSWORD,
  database: process.env.SQL_DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;