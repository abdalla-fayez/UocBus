const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const db = require('./models/dbconnection'); // Import the MySQL connection
const bookingRoutes = require('./js/booking');
const path = require('path');
const paymentRoutes = require('./js/payment'); // Import the payment routes
const sessionStorageRoutes = require('./js/sessionmng/sessionstorage');
const ticketGenRoutes = require('./js/ticketgenerator');
const app = express();

process.env.TZ = 'Africa/Egypt'; // THIS SETS THE TIMEZONE OF NODE.JS TO EGYPT AS IT DEFAULTS TO UTC

dotenv.config(); // Load environment variables

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET, // Replace with a strong secret key
    resave: false, // Prevent unnecessary session save operations
    saveUninitialized: true, // Save sessions even if they're empty
    cookie: { maxAge: 15 * 60 * 1000, secure: false }, // 15 minutes cookie // Set true if using HTTPS
}));

app.use(express.urlencoded({ extended: true })); // Optional: For form-encoded data

app.use((req, res, next) => {
    console.log(`Middleware triggered for ${req.method} ${req.url}`);
    next();
});

// Cache-Control for APIs
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    next();
});

app.use(sessionStorageRoutes);

// Code below not needed since apache is the webserver responsible for serving the frontend files.
// // Serve static files for testing (like index.html) with cache-control
// app.use('/static', express.static(path.join(__dirname, '../frontend'), {
//     setHeaders: (res, path) => {
//         res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
//         res.setHeader('Pragma', 'no-cache');
//     }
// }));

// Use the booking API routes
app.use('/api', bookingRoutes);

app.use('/api', ticketGenRoutes);

// Use the payments API routes
app.use(paymentRoutes);

// Start the server
app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
