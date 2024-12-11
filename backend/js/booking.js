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


// Book a trip (reserve seats temporarily)
router.post('/trips/book', async (req, res) => {
    const { trip_id, seats_booked } = req.body;

    if (!trip_id || !seats_booked || seats_booked <= 0) {
        return res.status(400).json({ message: 'Invalid trip or seat data' });
    }

    try {
        const [trip] = await db.query(
            `SELECT available_seats FROM trips WHERE id = ?`,
            [trip_id]
        );

        if (!trip || trip.available_seats < seats_booked) {
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        const updatedSeats = trip.available_seats - seats_booked;
        await db.query(
            `UPDATE trips SET available_seats = ? WHERE id = ?`,
            [updatedSeats, trip_id]
        );

        res.json({ success: true, trip_id, seats_booked });
    } catch (error) {
        console.error('Error in booking:', error);
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


module.exports = router;
