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
        // Temporarily reserve seats
        await db.query(
            `UPDATE trips SET available_seats = available_seats - ? WHERE id = ?`,
            [seatsBooked, tripId]
        );

        const orderId = `${tripId}-${Date.now()}`;

        // Insert payment record
        await db.query(
            `INSERT INTO payments (order_id, trip_id, seats_booked, amount, status) VALUES (?, ?, ?, ?, 'PENDING')`,
            [orderId, tripId, seatsBooked, amountPayable]
        );

        // Prepare and initiate payment session with NBE
        const merchantId = process.env.MERCHANT_ID;
        const apiPassword = process.env.API_PASSWORD;
        const auth = Buffer.from(`merchant.${merchantId}:${apiPassword}`).toString('base64');

        const nbeResponse = await axios.post(
            `https://nbe.gateway.mastercard.com/api/rest/version/61/merchant/${merchantId}/session`,
            {
                apiOperation: 'CREATE_CHECKOUT_SESSION',
                order: {
                    amount: amountPayable.toFixed(2),
                    currency: 'EGP',
                    id: orderId
                },
                interaction: {
                    operation: 'PURCHASE',
                    returnUrl: 'https://172.16.50.207/api/payments/callback'
                }
            },
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { id: sessionId } = nbeResponse.data.session;
        const redirectUrl = `https://nbe.gateway.mastercard.com/checkout/version/61/checkout.js`;

        console.log('Payment initiation response:', { sessionId, redirectUrl });


        res.json({ sessionId, redirectUrl });
    } catch (error) {
        console.error('Error initiating payment:', error);

        // Rollback seat reservation
        await db.query(
            `UPDATE trips SET available_seats = available_seats + ? WHERE id = ?`,
            [seatsBooked, tripId]
        );

        res.status(500).json({ message: 'Error initiating payment' });
    }
});



router.post('/api/payments/callback', async (req, res) => {
    const { orderId, result } = req.body;

    try {
        const status = result === 'SUCCESS' ? 'SUCCESS' : 'FAILED';

        const [payment] = await db.query(`SELECT * FROM payments WHERE order_id = ?`, [orderId]);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const { trip_id, seats_booked } = payment;

        // Update payment status
        await db.query(`UPDATE payments SET status = ? WHERE order_id = ?`, [status, orderId]);

        if (status === 'SUCCESS') {
            // Confirm booking
            await db.query(
                `INSERT INTO bookings (trip_id, user_id, seats_booked, status) VALUES (?, ?, ?, 'CONFIRMED')`,
                [trip_id, req.session.userId, seats_booked]
            );
            res.json({ message: 'Payment confirmed, booking finalized' });
        } else {
            // Release reserved seats
            await db.query(
                `UPDATE trips SET available_seats = available_seats + ? WHERE id = ?`,
                [seats_booked, trip_id]
            );
            res.json({ message: 'Payment failed, seats released' });
        }
    } catch (error) {
        console.error('Error handling payment callback:', error);
        res.status(500).json({ message: 'Error processing payment callback' });
    }
});



router.get('/api/payments/result', async (req, res) => {
    const { orderId } = req.query;

    try {
        const [payment] = await db.query(
            `SELECT status FROM payments WHERE order_id = ?`,
            [orderId]
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: `Payment status: ${payment.status}` });
    } catch (error) {
        console.error('Error fetching payment result:', error);
        res.status(500).json({ message: 'Error retrieving payment result' });
    }
});







module.exports = router;
