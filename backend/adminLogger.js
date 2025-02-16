const dotenv = require('dotenv');
dotenv.config();
const { createLogger, format, transports } = require('winston');

const adminLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    // Custom format to output a clean string with the message.
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'admin-actions.log' })
  ],
});

// Helper function to log admin actions along with all properties of the affected record
function logAdminAction(adminUser, action, record) {
  // Ensure we include the admin username
  const username = adminUser && adminUser.username ? adminUser.username : 'Unknown';
  // Convert the record object to a pretty JSON string for readability
  const recordStr = JSON.stringify(record, null, 2);
  adminLogger.info(`${action} by user (${username}):\n${recordStr}`);
}

module.exports = { adminLogger, logAdminAction };
