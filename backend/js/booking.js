const dotenv = require('dotenv');
const express = require('express');
const router = express.Router();
const db = require('../models/db'); //Database connection


// Get available trips
router.get('/trips/available', async (req, res) => {
    const { departure, arrival, date } = req.query;

    try {
        const query = `
            SELECT trips.id, trips.trip_date, trips.available_seats, trips.route_name
            FROM trips
            JOIN routes ON trips.route_id = routes.id
            WHERE routes.departure = ? AND routes.arrival = ? AND trips.trip_date = ?;
        `;
        const [results] = await db.query(query, [departure, arrival, date]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Server error' });
}
});

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

// // Route to save booking details
// router.post('/create', async (req, res) => {
//     const { studentName, studentEmail, studentId, studentMobileNo, orderId } = req.body;

//     try {
//         // Validate input
//         if (!studentName || !studentEmail || !studentId || !studentMobileNo || !orderId) {
//             return res.status(400).json({ message: 'All fields are required.' });
//         }

//         // Insert booking details into the database
//         await db.query(
//             'INSERT INTO bookings (student_name, student_email, student_id, student_mobile_no, order_id) VALUES (?, ?, ?, ?, ?)',
//             [studentName, studentEmail, studentId, studentMobileNo, orderId]
//         );

//         res.status(201).json({ message: 'Booking created successfully.' });
//     } catch (error) {
//         console.error('Error creating booking:', error);
//         res.status(500).json({ message: 'Failed to create booking.' });
//     }
// });


module.exports = router;
