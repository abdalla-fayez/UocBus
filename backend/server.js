const express = require('express');
const dotenv = require('dotenv');
const db = require('./models/db'); // Import the MySQL connection
const bookingRoutes = require('./js/booking');
const path = require('path');
const paymentRoutes = require('./js/payment'); // Import the payment routes
dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Serve static files for testing (like index.html)
app.use(express.static(path.join(__dirname, '../frontend')));

// Use the booking API routes
app.use('/api', bookingRoutes);
// Use the payments API routes
app.use('/api/payments', paymentRoutes);
// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on https://172.16.50.207:${PORT}`));
