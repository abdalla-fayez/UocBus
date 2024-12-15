// Cache DOM elements
const tripIdField = document.getElementById('tripId');
const seatsBookedField = document.getElementById('seatsBooked');
const payNowButton = document.getElementById('payNowButton');
const modal = document.getElementById('paymentModal');
const modalMessage = document.getElementById('paymentResultMessage');
const closeModal = document.getElementById('closeModal');


// Fetch booking details from the backend session
async function getBookingDetails() {
    try {
        const response = await fetch('/api/session/booking/retrieve');
        if (!response.ok) {
            throw new Error('Failed to retrieve booking details');
        }

        const { tripId, seatsBooked, amountPayable } = await response.json();

        // Populate hidden fields with retrieved data
        tripIdField.value = tripId;
        seatsBookedField.value = seatsBooked;

        return { tripId, seatsBooked, amountPayable };
    } catch (error) {
        console.error('Error fetching booking details:', error);
        alert('Failed to retrieve booking details. Please try again.');
        throw error; // Stop further execution if fetching details fails
    }
}


// Event listener for "Pay Now" button
payNowButton.addEventListener('click', async () => {
    try {
        // Initiate payment and get session ID
        const response = await fetch('/api/payments/initiate', { method: 'POST' });
        const { sessionId, orderId: generatedOrderId } = await response.json();

        if (!sessionId || !generatedOrderId) {
            throw new Error('Failed to initiate payment. Missing sessionId or orderId.');
        }
        
        orderId = generatedOrderId;

        // Configure hosted checkout
        Checkout.configure({
            session: { id: sessionId },

            
        });
        // Display embedded hosted checkout form
        Checkout.showLightbox('#checkoutContainer');

    } catch (error) {
        console.error('Error initiating payment:', error);
        alert('An error occurred while initiating payment. Please try again.');
    }
});

// Fetch booking details on page load to initialize the form
getBookingDetails();
