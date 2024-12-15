const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const db = require('./models/db'); // Import the MySQL connection
const bookingRoutes = require('./js/booking');
const path = require('path');
const paymentRoutes = require('./js/payment'); // Import the payment routes
const sessionStorageRoutes = require('./js/sessionmng/sessionstorage');

const app = express();

dotenv.config(); // Load environment variables

app.use(express.json());

app.use(session({
    secret: 'uocbussessionsecretkeybecausewhynot', // Replace with a strong secret key
    resave: false, // Prevent unnecessary session save operations
    saveUninitialized: true, // Save sessions even if they're empty
    cookie: { maxAge: 15 * 60 * 1000, secure: false }, // 15 minutes, HTTPS-only // Set true if using HTTPS
}));


app.use(express.urlencoded({ extended: true })); // Optional: For form-encoded data
app.use(express.text({ type: 'text/plain' })); // Handle text/plain payloads


app.use((req, res, next) => {
    console.log('Middleware triggered: Parsing request body...');
    next();
});

app.use(sessionStorageRoutes);

// Serve static files for testing (like index.html)
app.use(express.static(path.join(__dirname, '../frontend')));

// Use the booking API routes
app.use('/api', bookingRoutes);

// Use the payments API routes
app.use(paymentRoutes);
app.use('/api/payment', paymentRoutes);

// Start the server
app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
});
