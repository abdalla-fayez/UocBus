const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables
const path = require('path');
global.__basedir = path.resolve(__dirname, '../'); // This sets the base directory as the root of your project
const passport = require('./auth');
const adminAuthRoutes = require('./adminauth');
const db = require('./models/dbconnection'); // Import the MySQL connection
const bookingRoutes = require('./js/booking');
const paymentRoutes = require('./js/payment'); // Import the payment routes
const sessionStorageRoutes = require('./js/sessionmng/sessionstorage');
const ticketGenRoutes = require('./js/ticketgenerator');
const app = express();
const qs = require('qs');
const winston = require('winston');
const logger = require(`${__basedir}/backend/logger`);


process.env.TZ = 'Africa/Egypt'; // THIS SETS THE TIMEZONE OF NODE.JS TO EGYPT AS IT DEFAULTS TO UTC

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Optional: For form-encoded data
app.set('query parser', (str) => qs.parse(str));

app.use(session({
    secret: process.env.SESSION_SECRET, // Replace with a strong secret key
    resave: false, // Prevent unnecessary session save operations
    saveUninitialized: true, // Do not save uninitialized sessions
    cookie: { secure: false }, // Set true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

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

// Authentication routes
app.get('/auth/microsoft', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }));

app.post('/auth/microsoft/callback',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    (req, res) => {
        logger.info('Authentication successful, redirecting to homepage');
        // logger.info(`User profile: ${JSON.stringify(req.user)}`);

        // Store user data in the session
        req.session.user = {
            displayName: req.user.displayName,
            email: req.user._json.email,
            photo: req.user.photo,
            jobTitle: req.user.jobTitle
        };

        // logger.info(`Session data: ${JSON.stringify(req.session)}`);
        res.redirect('/'); // Redirect to homepage on successful login
    }
);

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        logger.info('User is authenticated');
        return next();
    }
    logger.info('User is not authenticated, redirecting to /auth/microsoft');
    res.redirect('/auth/microsoft');
}

// Protect all routes except authentication routes
app.use((req, res, next) => {
    if (req.path.startsWith('/auth/microsoft') || req.path.startsWith('/api/check-auth')) {
        return next();
    }
    ensureAuthenticated(req, res, next);
});

// Endpoint to check authentication
app.get('/api/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
        logger.info('User is authenticated for /api/check-auth');
        res.status(200).json({ authenticated: true });
    } else {
        logger.info('User is not authenticated for /api/check-auth');
        res.status(401).json({ authenticated: false });
    }
});

// Logout route
app.get('/api/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            const logoutUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent('https://busticketing.uofcanada.edu.eg')}`;
            res.redirect(logoutUrl); 
        });
    });
});

// Define your routes here
app.use(paymentRoutes);
app.use('/api/',bookingRoutes);
app.use('/api/',sessionStorageRoutes);
app.use('/api/',ticketGenRoutes);
app.use('/api/',adminAuthRoutes);

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