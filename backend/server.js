const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
global.__basedir = path.resolve(__dirname, '../'); // This sets the base directory as the root of your project
const db = require('./models/dbconnection'); // Import the MySQL connection
const bookingRoutes = require('./js/booking');
const paymentRoutes = require('./js/payment'); // Import the payment routes
const sessionStorageRoutes = require('./js/sessionmng/sessionstorage');
const ticketGenRoutes = require('./js/ticketgenerator');
const app = express();
const winston = require('winston');
const logger = require(`${__basedir}/backend/logger`);


process.env.TZ = 'Africa/Egypt'; // THIS SETS THE TIMEZONE OF NODE.JS TO EGYPT AS IT DEFAULTS TO UTC

dotenv.config(); // Load environment variables

app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Optional: For form-encoded data

app.use(session({
    secret: process.env.SESSION_SECRET, // Replace with a strong secret key
    resave: false, // Prevent unnecessary session save operations
    saveUninitialized: true, // Save sessions even if they're empty
    cookie: { maxAge: 15 * 60 * 1000, secure: false }, // 15 minutes cookie // Set true if using HTTPS
}));

app.use((req, res, next) => {
    logger.info(`Middleware triggered for ${req.method} ${req.url}`);
    next();
});

// Cache-Control for APIs
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    next();
});

// Use the session manager routes
app.use(sessionStorageRoutes);

// Use the booking API routes
app.use('/api', bookingRoutes);

// Use the ticcket generation routes
app.use('/api', ticketGenRoutes);

// Use the payments API routes
app.use(paymentRoutes);

// Capture uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.stack || err.message}`);
    process.exit(1); // Exit the process (optional)
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.stack || reason}`);
});

// Log Process Exit
process.on('exit', (code) => {
    logger.info(`Process exiting with code: ${code}`);
});

// Handle SIGINT (Ctrl+C) or Server Stops
process.on('SIGINT', () => {
    logger.warn('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
});

// Start the server
app.listen(process.env.PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${process.env.PORT}`);
});
