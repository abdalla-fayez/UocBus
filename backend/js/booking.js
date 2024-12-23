const dotenv = require('dotenv');
const express = require('express');
const router = express.Router();
const db = require('../models/dbconnection'); //Database connection
dotenv.config();

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

router.get('/bookings/details', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ message: 'Missing orderId' });
    }

    try {
        const [details] = await db.query(`
            SELECT 
                b.student_name, 
                b.student_id, 
                b.student_email, 
                b.student_mobile_no,
                r.departure AS \`from\`,
                r.arrival AS \`to\`,
                t.trip_date, 
                p.seats_booked, 
                p.amount AS total_amount, 
                p.order_id
            FROM bookings b
            JOIN payments p ON b.order_id = p.order_id
            JOIN trips t ON p.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            WHERE p.order_id = ?
        `, [orderId]);

        if (!details.length) {
            return res.status(404).json({ message: 'Booking details not found' });
        }

        res.json(details[0]);
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({ message: 'Server error while fetching booking details' });
    }
});



module.exports = router;
