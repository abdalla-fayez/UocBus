const dotenv = require('dotenv');
dotenv.config();
const { createLogger, format, transports } = require('winston');

const timezoned = () => {
    return new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Riyadh',
    });
}

const logger = createLogger({
    level: 'info',
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.timestamp({ format: timezoned }),
                format.printf(({ timestamp, level, message, ...metadata }) => {
                    let log = `[${timestamp}] ${level}: ${message}`;
                    if (Object.keys(metadata).length) {
                        log += ` ${JSON.stringify(metadata)}`;
                    }
                    return log;
                })
            )
        }),
        new transports.File({ 
            filename: 'server.log',
            format: format.combine(
                format.timestamp({ format: timezoned }),
                format.printf(({ timestamp, level, message, ...metadata }) => {
                    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
                    if (Object.keys(metadata).length) {
                        log += ` ${JSON.stringify(metadata)}`;
                    }
                    return log;
                })
            )
        }),
    ],
});

module.exports = logger;
