// Cache DOM elements
const bookingIdInput = document.getElementById('bookingId'); // Booking ID field
const amountInput = document.getElementById('amount'); // Amount field
const payNowButton = document.getElementById('payNow'); // "Pay Now" button

// Event listener for "Pay Now" button
payNowButton.addEventListener('click', async () => {
    const bookingId = bookingIdInput.value; // Get booking ID value
    const amount = amountInput.value; // Get amount value

    try {
        // Send payment initiation request to the backend
        const response = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookingId, amount }), // Send booking ID and amount
        });

        const result = await response.json();

        if (result.redirectUrl) {
            // Redirect the user to the Hosted Checkout page
            window.location.href = result.redirectUrl;
        } else {
            // Show error if the initiation failed
            alert('Payment initiation failed: ' + result.message);
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        alert('An error occurred while initiating payment. Please try again later.');
    }
});
