const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const logger = require(`${__basedir}/backend/logger`);

const pool = mysql.createPool({
  host: process.env.DB_HOST, // Your DB host
  user: process.env.DB_USER, // Your DB username
  password: process.env.DB_PASS, // Your DB password
  database: process.env.DB_NAME, // Your DB name
  waitForConnections: true,
  connectionLimit: 15, // Max number of connections in the pool
  queueLimit: 0, // Unlimited requests in the queue
  debug: false, // Console verbose logging
});

const promisePool = pool.promise();

pool.on('error', (err) => {
  logger.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      logger.error('Reconnecting to the database...');
      // The pool handles reconnection automatically.
  } else {
      throw err; // Let the app crash for unknown errors
  }
});

async function checkDatabaseConnection() {
  try {
      const [rows] = await promisePool.query('SELECT 1');
      logger.info('Database connection is healthy');
  } catch (err) {
      logger.error('Database connection failed:', err);
  }
}

// Periodically check the connection
setInterval(checkDatabaseConnection, 60 * 10000); // Every 10 minutes

// setInterval(async () => {
//   try {
//       await promisePool.query('SELECT 1');
//       logger.info('Database connection is alive KEEPALIVE');
//   } catch (err) {
//       logger.error('Error during keep-alive query:', err);
//   }
// }, 600000); // Run every 10 minutes

module.exports = {
  query: (sql, params) => promisePool.query(sql, params), // Simplified query wrapper
  close: () => promisePool.end(), // Close all connections gracefully
};