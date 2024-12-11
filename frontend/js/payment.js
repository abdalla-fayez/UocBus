// Cache DOM elements
const tripIdField = document.getElementById('tripId');
const seatsBookedField = document.getElementById('seatsBooked');
const payNowButton = document.getElementById('payNow');

// Fetch trip details from the backend session
async function getTripDetails() {
    try {
        const response = await fetch('/api/session/trip/retrieve');
        if (!response.ok) {
            throw new Error('Failed to retrieve trip details');
        }

        const { tripId, seatsBooked } = await response.json();

        // Populate hidden fields with retrieved data
        tripIdField.value = tripId;
        seatsBookedField.value = seatsBooked;

        return { tripId, seatsBooked };
    } catch (error) {
        console.error('Error fetching trip details:', error);
        alert('Failed to retrieve trip details. Please try again.');
        throw error; // Stop further execution if fetching details fails
    }
}

// Event listener for "Pay Now" button
payNowButton.addEventListener('click', async () => {
    try {
        // Retrieve trip details
        const response = await fetch('/api/session/trip/retrieve');
        const { tripId, seatsBooked } = await response.json();

        // Initiate payment
        const paymentResponse = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId, seatsBooked }),
        });

        const result = await paymentResponse.json();

        if (result.redirectUrl) {
            // Redirect to mock payment gateway
            window.location.href = result.redirectUrl;
        } else {
            alert(`Payment initiation failed: ${result.message}`);
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        alert('An error occurred while initiating payment. Please try again.');
    }
});


// Fetch trip details on page load to initialize the form
getTripDetails();
