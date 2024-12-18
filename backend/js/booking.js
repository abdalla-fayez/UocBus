const dotenv = require('dotenv');
const express = require('express');
const router = express.Router();
const db = require('../models/db'); //Database connection

// Get grouped departure and arrival locations
router.get('/locations', async (req, res) => {
    try {
        // Fetch departure and arrival locations separately
        const [departures] = await db.query(`SELECT DISTINCT departure FROM routes`);
        const [arrivals] = await db.query(`SELECT DISTINCT arrival FROM routes`);

        // Map results to arrays
        const departureLocations = departures.map(row => row.departure);
        const arrivalLocations = arrivals.map(row => row.arrival);

        // Return grouped data
        res.json({
            departure: departureLocations,
            arrival: arrivalLocations,
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Endpoint to fetch available trips based on departure, arrival, and date
router.get('/trips/available', async (req, res) => {
    const { departure, arrival, date } = req.query;

    // Validate query parameters to ensure required inputs are provided
    if (!departure || !arrival || !date) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // SQL query to fetch trips with available seats greater than 0
        const query = `
            SELECT 
                trips.id, 
                trips.trip_date, 
                trips.available_seats, 
                routes.route_name, 
                routes.price
            FROM trips
            JOIN routes ON trips.route_id = routes.id
            WHERE routes.departure = ? 
              AND routes.arrival = ? 
              AND trips.trip_date = ? 
              AND trips.available_seats > 0;
        `;

        // Execute the query with the provided parameters
        const [results] = await db.query(query, [departure, arrival, date]);

        // Send the filtered trip results back to the frontend
        res.json(results);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Server error' }); // Handle server errors gracefully
    }
});


router.post('/bookings/create', async (req, res) => {
    const { studentName, studentEmail, studentId, studentMobileNo } = req.body;

    // Input validation
    if (!studentName || !studentEmail || !studentId || !studentMobileNo) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Insert only student info and timestamp into the bookings table
        const [result] = await db.query(
            `INSERT INTO bookings (student_name, student_email, student_id, student_mobile_no, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [studentName, studentEmail, studentId, studentMobileNo]
        );

        // Save the booking ID in the session for further processing (e.g., linking order_id later)
        req.session.bookingId = result.insertId;

        console.log('Booking entry created with ID:', result.insertId);

        res.json({ message: 'Booking details stored successfully.', bookingId: result.insertId });
    } catch (error) {
        console.error('Error storing booking details:', error);
        res.status(500).json({ message: 'An error occurred while storing booking details.' });
    }
});



module.exports = router;
