const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload'); // Add this line
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
const adminOpsRoutes = require('./adminops');
const app = express();
const qs = require('qs');
const winston = require('winston');
const logger = require(`${__basedir}/backend/logger`);
const adminLogger = require(`${__basedir}/backend/adminLogger`);
const pendingScheduler = require('./js/pendingScheduler');
const dbBackupScheduler = require('./js/dbBackupScheduler');
process.env.TZ = 'Africa/Egypt'; // THIS SETS THE TIMEZONE OF NODE.JS TO EGYPT AS IT DEFAULTS TO UTC

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({    // Add this middleware configuration
  createParentPath: true,
  limits: { 
    fileSize: 1 * 1024 * 1024 // 1MB max file size
  },
  abortOnLimit: true,
  useTempFiles: false
}));
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
    async (req, res) => {
        logger.info('Authentication successful, redirecting to homepage');
        // logger.info(`User profile: ${JSON.stringify(req.user)}`);

        // Store user data in the session
        req.session.user = {
            displayName: req.user.displayName,
            email: req.user._json.email,
            photo: req.user.photo,
            jobTitle: req.user.jobTitle
        };
        try {
            // Check if the user already exists in the database
            const [rows] = await db.query(`SELECT * FROM users WHERE student_email = ?`, [req.user._json.email]);
            if (rows.length === 0) {
                // User does not exist, insert new user
                await db.query(
                    `INSERT INTO users (student_name, student_email, student_id) VALUES (?, ?, ?)`,
                    [req.user.displayName, req.user._json.email, req.user.jobTitle || 'N/A']
                );
            }
            // User exists, update their information if necessary
            else {
                await db.query(
                    `UPDATE users SET student_name = ?, student_id = ? WHERE student_email = ?`,
                    [req.user.displayName, req.user.jobTitle || 'N/A', req.user._json.email]
                );
            }
        } catch (error) {
            logger.error('Error while checking or inserting user:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
        // logger.info(`Session data: ${JSON.stringify(req.session)}`);
        res.redirect('/'); // Redirect to homepage on successful login
    }
);

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        // logger.info('User is authenticated');
        return next();
    }
    logger.info('User is not authenticated, redirecting to /auth/microsoft');
    res.redirect('/auth/microsoft');
}

// Protect all routes except authentication routes
app.use((req, res, next) => {
    if (req.path.startsWith('/auth/microsoft') || req.path.startsWith('/api/check-auth') || req.path.startsWith('/api/admin')) {
        return next();
    }
    ensureAuthenticated(req, res, next);
});

// Endpoint to check MS authentication
app.get('/api/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
        logger.info(`User ${req.session.user.email} is authenticated for /api/check-auth`);
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

// Middleware to ensure an admin is authenticated
function ensureAdminAuthenticated(req, res, next) {
    if (req.session && req.session.adminUser) {
      logger.info('Admin is authenticated');
      return next();
    }
    logger.info('Admin is not authenticated, redirecting to /api/admin/login');
    res.redirect('/api/admin/login');
  }
  
  // Protect all routes under /api/admin except for /login and /check-auth
  app.use('/api/admin', (req, res, next) => {
    // Allow login and auth-check endpoints to be accessed without an admin session
    if (req.path.startsWith('/login') || req.path.startsWith('/check-auth')) {
      return next();
    }
    ensureAdminAuthenticated(req, res, next);
  });
  
// Define your routes here
app.use(paymentRoutes);
app.use('/api/',bookingRoutes);
app.use('/api/',sessionStorageRoutes);
app.use('/api/',ticketGenRoutes);
app.use('/api/admin',adminOpsRoutes);
app.use('/api/admin',adminAuthRoutes);

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