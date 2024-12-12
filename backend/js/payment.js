const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../models/db'); // Replace with your DB model
const dotenv = require('dotenv');
dotenv.config();

// Payment initiation endpoint
router.post('/api/payments/initiate', async (req, res) => {
    const bookingDetails = req.session.bookingDetails;

    if (!bookingDetails) {
        return res.status(404).json({ message: 'No booking details found in session' });
    }

    const { tripId, seatsBooked, amountPayable } = bookingDetails;

    try {
        // Temporarily reserve seats in the database
        await db.query(
            `UPDATE trips SET available_seats = available_seats - ? WHERE id = ?`,
            [seatsBooked, tripId]
        );

        const orderId = `${tripId}-${Date.now()}`;

        // Insert payment record into the database
        await db.query(
            `INSERT INTO payments (order_id, trip_id, seats_booked, amount, status) VALUES (?, ?, ?, ?, 'PENDING')`,
            [orderId, tripId, seatsBooked, amountPayable]
        );

        // NBE API credentials
        const merchantId = process.env.MERCHANT_ID;
        const apiPassword = process.env.API_PASSWORD;
        const auth = Buffer.from(`merchant.${merchantId}:${apiPassword}`).toString('base64');
        const absoluteCallbackUrl = 'https://172.16.50.207/api/payments/callback';

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
                            line2: 'New Capital'    
                        }
                    },
                    returnUrl: absoluteCallbackUrl,
                },
            },
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        const { id: sessionId } = nbeResponse.data.session;

        console.log('Payment initiation response:', { sessionId });

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

// Callback endpoint
// Handle successful payment callbacks
router.post('/api/payments/callback', async (req, res) => {
    const { orderId, result } = req.body;

    try {
        console.log('Payment callback received:', req.body);

        if (!orderId || !result) {
            return res.status(400).json({ message: 'Invalid callback data' });
        }

        const [paymentRecord] = await db.query(
            'SELECT trip_id, seats_booked FROM payments WHERE order_id = ?',
            [orderId]
        );

        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const { trip_id: tripId, seats_booked: seatsBooked } = paymentRecord;

        if (result === 'SUCCESS') {
            // Finalize booking
            await db.query(
                'UPDATE payments SET status = "SUCCESS" WHERE order_id = ?',
                [orderId]
            );

            console.log(`Payment successful for orderId: ${orderId}`);
            return res.json({ message: 'Payment confirmed and booking finalized' });
        } else {
            // Release reserved seats for failure
            await db.query(
                'UPDATE trips SET available_seats = available_seats + ? WHERE id = ?',
                [seatsBooked, tripId]
            );

            await db.query(
                'UPDATE payments SET status = "FAILED" WHERE order_id = ?',
                [orderId]
            );

            console.log(`Payment failed for orderId: ${orderId}. Seats released.`);
            return res.json({ message: 'Payment failed, seats released' });
        }
    } catch (error) {
        console.error('Error handling payment callback:', error);
        res.status(500).json({ message: 'Error processing payment callback' });
    }
});

// Handle error callback from the hosted checkout
router.get('/api/payments/callback/error', (req, res) => {
    console.error('Payment error callback triggered:', req.query);
    res.status(400).json({ message: 'An error occurred during payment processing.' });
});

// Handle cancellation callback from the hosted checkout
router.get('/api/payments/callback/cancel', (req, res) => {
    console.log('Payment cancellation callback triggered:', req.query);
    res.json({ message: 'Payment was cancelled by the user.' });
});

module.exports = router;
