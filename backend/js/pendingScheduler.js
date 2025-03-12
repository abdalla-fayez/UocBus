const schedule = require('node-schedule');
const db = require('../models/dbconnection'); // Adjust the path if needed
const dotenv = require('dotenv');
dotenv.config();
const logger = require(`${__basedir}/backend/logger`);

// Function to expire pending payments older than 7 minutes
async function expirePendingPayments() {
  try {
    // Select pending payments older than 7 minutes
    const [pendingPayments] = await db.query(`
      SELECT order_id, trip_id, seats_booked 
      FROM payments 
      WHERE status = 'PENDING'
      AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 7
    `);

    if (pendingPayments.length === 0) {
      // logger.info('No expired pending payments found.');
      return;
    }

    // Process each pending payment
    for (const payment of pendingPayments) {
      const { order_id, trip_id, seats_booked } = payment;
      // Mark payment as EXPIRED
      await db.query('UPDATE payments SET status = "EXPIRED" WHERE order_id = ?', [order_id]);
      // Release the reserved seats
      await db.query('UPDATE trips SET available_seats = available_seats + ? WHERE id = ?', [seats_booked, trip_id]);
      logger.info(`Expired payment ${order_id}: released ${seats_booked} seats for trip ${trip_id}`);
    }
  } catch (error) {
    logger.error(`Error expiring pending payments: ${error.message}`);
  }
}

// Schedule the job to run every 2 minutes using a cron-style expression.
// '*/2 * * * *' means every 2 minutes.
schedule.scheduleJob('*/2 * * * *', expirePendingPayments);

// Optionally, run the cleanup immediately on startup
//expirePendingPayments();

module.exports = { expirePendingPayments };
