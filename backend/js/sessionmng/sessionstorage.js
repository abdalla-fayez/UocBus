const express = require('express');
const router = express.Router();
const db = require('../../models/dbconnection'); // Database connection
const logger = require(`${__basedir}/backend/logger`);

router.post('/api/session/booking/store', async (req, res) => {
    logger.info('Request received at /api/session/booking/store:', req.body);

    const { tripId, seatsBooked } = req.body;

    if (!tripId || !seatsBooked || seatsBooked <= 0) {
        return res.status(400).json({ message: 'Invalid booking data' });
    }

    try {
         // Fetch trip details, including price, departure, arrival, and date
        const [rows] = await db.query(
        `SELECT routes.price AS ticketPrice, routes.departure, routes.arrival, trips.trip_date, routes.route_name, routes.trip_type
         FROM trips 
         JOIN routes ON trips.route_id = routes.id 
         WHERE trips.id = ?`,
        [tripId]
        );

        if (rows.length === 0) {
            console.error(`No trip found for tripId: ${tripId}`);
            return res.status(404).json({ message: 'Trip not found' });
        }

        const tripDetails = rows[0];
        const ticketPrice = parseFloat(tripDetails.ticketPrice);

        if (isNaN(ticketPrice)) {
            console.error(`Invalid ticket price for tripId: ${tripId}`);
            return res.status(500).json({ message: 'Ticket price not available' });
        }

        // Calculate the total amount payable
        const amountPayable = ticketPrice * seatsBooked;

        // Store booking details in the session
        req.session.bookingDetails = {
            tripId,
            seatsBooked,
            ticketPrice,
            amountPayable,
            tripDate: new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(tripDetails.trip_date)),
            departure: tripDetails.departure,
            arrival: tripDetails.arrival,
            routeName: tripDetails.route_name,
            tripType: tripDetails.trip_type
        };

        logger.info('Booking details stored in session:', req.session.bookingDetails);

        res.json({ message: 'Booking details stored successfully' });
    } catch (error) {
        console.error('Error storing booking details:', error);
        res.status(500).json({ message: 'An error occurred while storing booking details' });
    }
});

router.get('/api/session/booking/retrieve', (req, res) => {
    if (!req.session || !req.session.bookingDetails) {
        return res.status(404).json({ message: 'No booking details found in session' });
    }

    logger.info('Retrieved booking details:', req.session.bookingDetails);

    res.json(req.session.bookingDetails);
});

module.exports = router;
