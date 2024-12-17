const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../models/db'); // Replace with your DB model
const dotenv = require('dotenv');
dotenv.config();

// Payment initiation endpoint
router.post('/api/payments/initiate', async (req, res) => {
    const bookingDetails = req.session.bookingDetails;
    const bookingId = req.session.bookingId; // Retrieve booking ID from session

    if (!bookingDetails) {
        return res.status(404).json({ message: 'No booking details found in session' });
    }
    if (!bookingId) {
        return res.status(404).json({ message: 'No booking details found in session' });
    }
    const { tripId, seatsBooked, amountPayable } = bookingDetails;

    try {
        // Validate seat availability
        const [tripDetails] = await db.query(
            `SELECT available_seats FROM trips WHERE id = ?`,
            [tripId]
        );
        
        if (!tripDetails || tripDetails.length === 0) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        const availableSeats = tripDetails[0].available_seats;

        if (availableSeats < seatsBooked) {
            return res.status(400).json({ message: 'Not enough seats available.' });
        }

        const orderId = `${tripId}-${Date.now()}`;

         // Update the bookings table with the generated order_id
         await db.query(
            `UPDATE bookings SET order_id = ? WHERE id = ?`,
            [orderId, bookingId]
        );
        console.log(`Order ID ${orderId} linked to booking ID ${bookingId}`);
        

        // Temporarily reserve seats in the database
        await db.query(
            `UPDATE trips SET available_seats = available_seats - ? WHERE id = ?`,
            [seatsBooked, tripId]
        );

        // Insert payment record into the database
        await db.query(
            `INSERT INTO payments (order_id, trip_id, seats_booked, amount, status) 
             VALUES (?, ?, ?, ?, 'PENDING')`,
            [orderId, tripId, seatsBooked, amountPayable]
        );

        // NBE API credentials
        const merchantId = process.env.MERCHANT_ID;
        const apiPassword = process.env.API_PASSWORD;
        const auth = Buffer.from(`merchant.${merchantId}:${apiPassword}`).toString('base64');
        const absoluteCallbackUrl = `https://172.16.50.207/api/payments/callback?orderId=${orderId}`;
        // const cancelCallbackUrl = `https://172.16.50.207/api/payments/callback/cancel?orderId=${orderId}`;
        // const errorCallbackUrl = `https://172.16.50.207/api/payments/callback/error?orderId=${orderId}`;


        // Create checkout session
        const nbeResponse = await axios.post(
            `https://nbe.gateway.mastercard.com/api/rest/version/61/merchant/${merchantId}/session`,
            {
                apiOperation: 'CREATE_CHECKOUT_SESSION',
                order: {
                    amount: amountPayable.toFixed(2),
                    currency: 'EGP',
                    id: orderId,
                    description: 'Bus Ticket Booking',
                },
                interaction: {
                    operation: 'PURCHASE',
                    merchant: {
                        name: 'University of Canada',
                        address: {
                            line1: 'New Capital',
                            line2: 'New Capital',
                        },
                    },
                    displayControl: {
                        billingAddress: 'HIDE',
                    },
                    returnUrl: absoluteCallbackUrl,
                    // cancelUrl: cancelCallbackUrl,
                    // errorUrl: errorCallbackUrl,
                },
            },
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { id: sessionId } = nbeResponse.data.session;

        console.log('Payment initiation response:', { sessionId, orderId });

        res.json({ sessionId, orderId });
    } catch (error) {
        console.error('Error initiating payment:', error);

        // Rollback seat reservation if payment initiation fails
        await db.query(
            `UPDATE trips SET available_seats = available_seats + ? WHERE id = ?`,
            [seatsBooked, tripId]
        );

        res.status(500).json({ message: 'Error initiating payment' });
    }
});

// Handle successful payment callbacks
router.get('/api/payments/callback', async (req, res) => {
    const { orderId, resultIndicator } = req.query;

    try {
        console.log('Payment callback received:', req.query);

        // Validate required parameters
        if (!orderId || !resultIndicator) {
            return res.status(400).json({ message: 'Invalid callback data' });
        }

        // Retrieve payment details from the database
        const [paymentRecord] = await db.query(
            'SELECT trip_id, seats_booked, status FROM payments WHERE order_id = ?',
            [orderId]
        );

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const { trip_id: tripId, seats_booked: seatsBooked } = paymentRecord[0];

        // Finalize booking if successful
        await db.query(
            'UPDATE payments SET status = "SUCCESS", updated_at = NOW() WHERE order_id = ?',
            [orderId]
        );

        // Clean up session data
        req.session.bookingId = null;
        req.session.bookingDetails = null;

        console.log(`Payment successful for orderId: ${orderId}, tripId: ${tripId}`);
        res.json({ message: 'Payment confirmed and booking finalized.' });
    } catch (error) {
        console.error('Error processing payment callback:', error);
        res.status(500).json({ message: 'Error processing payment callback.' });
    }
});

// Handle cancellation callback
router.get('/api/payments/callback/cancel', async (req, res) => {
    const { orderId } = req.query;

    try {
        if (!orderId) {
            console.error('Missing orderId in cancellation callback');
            return res.status(400).json({ message: 'Invalid cancellation callback data' });
        }

        console.log(`Processing cancellation for orderId: ${orderId}`);

        const [paymentRecord] = await db.query(
            'SELECT trip_id, seats_booked, status FROM payments WHERE order_id = ?',
            [orderId]
        );

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const { trip_id: tripId, seats_booked: seatsBooked, status } = paymentRecord[0];

        // Check if the cancellation has already been handled
        if (status === 'CANCELLED') {
            console.warn(`Cancellation already processed for orderId: ${orderId}`);
            return res.status(200).json({ message: 'Cancellation already processed.' });
        }

        // Release reserved seats and update payment status
        console.log(`Releasing seats: ${seatsBooked} for Trip ID: ${tripId}`);

        await db.query(
            'UPDATE payments SET status = "CANCELLED" WHERE order_id = ?',
            [orderId]
        );

        await db.query(
            'UPDATE trips SET available_seats = available_seats + ? WHERE id = ?',
            [seatsBooked, tripId]
        );

        // Clean up session data
        req.session.bookingId = null;
        req.session.bookingDetails = null;

        console.log(`Payment cancelled for orderId: ${orderId}. Seats released.`);
        res.status(200).json({ message: 'Payment cancelled successfully.' });
    } catch (error) {
        console.error('Error processing payment cancellation callback:', error);
        res.status(500).json({ message: 'Error processing cancellation callback.' });
    }
});


// Handle error callback
router.get('/api/payments/callback/error', async (req, res) => {
    const { orderId } = req.query;

    try {
        if (!orderId) {
            console.error('Missing orderId in error callback');
            return res.status(400).json({ message: 'Invalid error callback data' });
        }

        console.log(`Processing error for orderId: ${orderId}`);

        // Fetch the payment record
        const [paymentRecord] = await db.query(
            'SELECT trip_id, seats_booked, status FROM payments WHERE order_id = ?',
            [orderId]
        );

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const { trip_id: tripId, seats_booked: seatsBooked, status } = paymentRecord[0];

        // Check if the failure has already been handled
        if (status === 'FAILED') {
            console.warn(`Failure already processed for orderId: ${orderId}`);
            return res.status(200).json({ message: 'Failure already processed.' });
        }
        // Update the payment status to FAILED
        await db.query('UPDATE payments SET status = "FAILED" WHERE order_id = ?', [orderId]);

        // Release reserved seats
        await db.query(
            'UPDATE trips SET available_seats = available_seats + ? WHERE id = ?',
            [seatsBooked, tripId]
        );

        // Clean up session data
        req.session.bookingId = null;
        req.session.bookingDetails = null; 
        
        console.log(`Payment failed for orderId: ${orderId}. Seats released.`);
        res.status(200).json({ message: 'Payment error processed successfully.' });
    } catch (error) {
        console.error('Error processing payment error callback:', error);
        res.status(500).json({ message: 'Error processing error callback.' });
    }
});

module.exports = router;
