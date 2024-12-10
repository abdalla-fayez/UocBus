const express = require('express');
const dotenv = require('dotenv');
const db = require('./models/db'); // Import the MySQL connection
const bookingRoutes = require('./js/booking');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Serve static files for testing (like index.html)
app.use(express.static(path.join(__dirname, '../frontend')));

// Use the booking API routes
app.use('/api', bookingRoutes);

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

console.log('Serving static files from:', path.join(__dirname, '../frontend'));
