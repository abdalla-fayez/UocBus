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

// Fetch available trips with pickup points
router.get('/trips/available', async (req, res) => {
    const { departure, arrival, date } = req.query;

    console.log('Received query parameters:', { departure, arrival, date });

    if (!departure || !arrival || !date) {
        console.warn('Missing required query parameters.');
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // SQL query to fetch trips and their associated pickup points
        const query = `
            SELECT 
                trips.id AS id, -- Use 'id' instead of 'trip_id' for consistency
                trips.trip_date,
                trips.trip_time,
                trips.available_seats,
                routes.route_name,
                routes.price,
                routes.trip_type,
                pickup_points.name AS pickup_name,
                pickup_points.time AS pickup_time
            FROM trips
            JOIN routes ON trips.route_id = routes.id
            LEFT JOIN pickup_points ON routes.id = pickup_points.route_id
            WHERE (
                (trip_date = CURDATE() AND trip_time >= CURTIME())
                OR (trip_date > CURDATE())
            )
            AND routes.departure = ?
            AND routes.arrival = ?
            AND trips.trip_date = ?
            AND trips.available_seats > 0
            ORDER BY trip_date, trip_time, pickup_time;
        `;

        console.log('Executing SQL query for fetching trip details');

        const [results] = await db.query(query, [departure, arrival, date]);

        console.log('Query results:', results);

        // Group trips by id, adding pickup points to each trip
        const trips = {};
        results.forEach(row => {
            if (!trips[row.id]) {
                console.log(`Creating new trip entry for id: ${row.id}`);
                trips[row.id] = {
                    id: row.id, // Use 'id' to match frontend expectations
                    trip_date: row.trip_date,
                    trip_time: row.trip_time,
                    available_seats: row.available_seats,
                    route_name: row.route_name,
                    price: row.price,
                    trip_type: row.trip_type,
                    pickup_points: []
                };
            }

            if (row.pickup_name && row.pickup_time) {
                console.log(`Adding pickup point for id ${row.id}:`, {
                    name: row.pickup_name,
                    time: row.pickup_time
                });

                // Include pickup points only for morning routes or single point for afternoon
                if (row.trip_type === 'morning' || (row.trip_type === 'afternoon' && row.pickup_name === 'University')) {
                    trips[row.id].pickup_points.push({
                        name: row.pickup_name,
                        time: row.pickup_time
                    });
                }
            }
        });

        console.log('Final trips object:', trips);
        res.json(Object.values(trips));
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Server error' });
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
