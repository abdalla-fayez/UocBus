const dotenv = require('dotenv');
dotenv.config();
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...metadata }) => {
            let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
            if (Object.keys(metadata).length) {
                log += ` ${JSON.stringify(metadata)}`;
            }
            return log;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'server.log' }),
    ],
});

module.exports = logger;
