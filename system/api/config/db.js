const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.SQL_DATABASE_HOST,
  user: process.env.SQL_DATABASE_USERNAME,
  password: process.env.SQL_DATABASE_PASSWORD,
  database: process.env.SQL_DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;