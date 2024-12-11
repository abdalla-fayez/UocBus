const express = require('express');
const router = express.Router();
const axios = require('axios'); // For API requests
const db = require('../models/db'); // Import the database connection

// NBE Payment Gateway Configuration (Production URLs and Credentials)
const MERCHANT_ID = '';  // Replace with your production Merchant ID
const PASSWORD = '';       // Replace with your production API Password
const API_VERSION = '61';
const API_BASE_URL = `https://nbe.gateway.mastercard.com/api/rest/version/${API_VERSION}/merchant/${MERCHANT_ID}`;

// Route: Initiate Payment Session
// router.post('/initiate', async (req, res) => {
//     const { bookingId, amount } = req.body; // Extract booking ID and amount

//     try {
//         // Validate booking in the database
//         const [booking] = await db.promise().query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
//         if (!booking || booking.length === 0) {
//             return res.status(404).json({ message: 'Booking not found' });
//         }

//         // Prepare the payload for `createCheckoutSession`
//         const payload = {
//             order: {
//                 id: bookingId.toString(), // Use booking ID as the order ID
//                 amount: amount * 100,    // Amount in cents/piasters (e.g., 1 EGP = 100)
//                 currency: 'EGP',
//                 description: `Payment for Booking ID: ${bookingId}`,
//             },
//             interaction: {
//                 operation: 'PURCHASE',  // Specify the type of operation
//                 returnUrl: `https://172.16.50.207/api/payments/callback?orderId=${bookingId}`, // Success/failure callback URL
//             },
//         };

//         // Make the API request to create a checkout session
//         const response = await axios.post(`${API_BASE_URL}/session`, payload, {
//             auth: {
//                 username: MERCHANT_ID,
//                 password: PASSWORD,
//             },
//             headers: { 'Content-Type': 'application/json' },
//         });

//         // Extract the session URL for Hosted Checkout
//         const { session, _links } = response.data;
//         if (session && _links && _links.redirect) {
//             return res.json({ redirectUrl: _links.redirect.href });
//         }

//         res.status(500).json({ message: 'Failed to create checkout session' });
//     } catch (error) {
//         console.error('Error creating checkout session:', error.response?.data || error.message);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });

// Route: Handle Payment Callback
router.get('/callback', async (req, res) => {
    const { orderId, result, transactionId } = req.query;

    try {
        // Update payment status in the database
        const status = result === 'SUCCESS' ? 'success' : 'failed';
        await db.promise().query(
            'UPDATE payments SET status = ?, transaction_id = ? WHERE booking_id = ?',
            [status, transactionId, orderId]
        );

        // Redirect the user to the payment status page
        res.redirect(`/payment-status.html?status=${status}`);
    } catch (error) {
        console.error('Error handling payment callback:', error.message);
        res.status(500).send('Error processing payment status');
    }
});

// Payment initiation endpoint
router.post('/api/payments/initiate', async (req, res) => {
    const { tripId, seatsBooked } = req.body;

    // Validate input
    if (!tripId || !seatsBooked || seatsBooked <= 0) {
        return res.status(400).json({ message: 'Invalid trip or seat data' });
    }


    // MOCK REDIRECT URL FOR TESTING AND DEBUGGING!!!!
    const redirectUrl = `https://www.youtube.com`;
    res.json({ redirectUrl });
    // try {
    //     // Verify trip exists and seats are reserved
    //     const [trip] = await db.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    //     if (!trip) {
    //         return res.status(404).json({ message: 'Trip not found' });
    //     }

    //     // Calculate payment amount
    //     const [route] = await db.query('SELECT price FROM routes WHERE id = ?', [trip.route_id]);
    //     if (!route) {
    //         return res.status(404).json({ message: 'Route not found' });
    //     }
    //     const totalAmount = route.price * seatsBooked;

    //     // Mock payment gateway URL (replace with real API integration)
    //     const redirectUrl = `https://mockpaymentgateway.com/checkout?amount=${totalAmount}&tripId=${tripId}&seats=${seatsBooked}`;

    //     res.json({ redirectUrl });
    // } catch (error) {
    //     console.error('Error initiating payment:', error);
    //     res.status(500).json({ message: 'Server error' });
    // }
});

module.exports = router;
