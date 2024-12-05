const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bus_ticketing',
});

// Get available trips
router.get('/trips/available', (req, res) => {
    const { departure, arrival, date } = req.query;
    const query = `
        SELECT trips.id, trips.trip_date, trips.available_seats, routes.name
        FROM trips
        JOIN routes ON trips.route_id = routes.id
        WHERE routes.departure = ? AND routes.arrival = ? AND trips.trip_date = ?;
    `;
    db.query(query, [departure, arrival, date], (err, results) => {
        if (err) {
            console.error('Error fetching trips:', err);
            res.status(500).send('Error fetching trips');
        } else {
            res.json(results);
        }
    });
});

// Book a trip
router.post('/trips/book', (req, res) => {
    const { trip_id, seats_booked } = req.body;
    const getSeatsQuery = `SELECT available_seats FROM trips WHERE id = ?`;

    db.query(getSeatsQuery, [trip_id], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error checking available seats:', err);
            return res.status(500).json({ error: 'Trip not found or database error' });
        }

        const availableSeats = results[0].available_seats;
        if (availableSeats < seats_booked) {
            return res.status(400).json({ error: 'Not enough seats available' });
        }

        const updateSeatsQuery = `UPDATE trips SET available_seats = available_seats - ? WHERE id = ?`;
        db.query(updateSeatsQuery, [seats_booked, trip_id], (updateErr) => {
            if (updateErr) {
                console.error('Error updating seats:', updateErr);
                return res.status(500).json({ error: 'Error updating seats' });
            }

            // Record the booking in the bookings table
            const insertBookingQuery = `
                INSERT INTO bookings (trip_id, seats_booked, payment_status, created_at)
                VALUES (?, ?, 'pending', NOW())
            `;
            db.query(insertBookingQuery, [trip_id, seats_booked], (insertErr) => {
                if (insertErr) {
                    console.error('Error recording booking:', insertErr);
                    return res.status(500).json({ error: 'Error recording booking' });
                }

                res.json({ trip_id, seats_booked });
            });
        });
    });
});

router.get('/locations', (req, res) => {
    const query = `
        SELECT DISTINCT departure FROM routes 
        UNION 
        SELECT DISTINCT arrival FROM routes
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching locations:', err);
            res.status(500).send('Error fetching locations');
        } else {
            // Flatten the results to an array of unique locations
            res.json(results.map(row => row.departure || row.arrival));
        }
    });
});

module.exports = router;
