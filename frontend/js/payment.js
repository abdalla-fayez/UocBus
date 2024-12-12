// Cache DOM elements
const tripIdField = document.getElementById('tripId');
const seatsBookedField = document.getElementById('seatsBooked');
const payNowButton = document.getElementById('payNowButton');
const modal = document.getElementById('paymentModal');
const modalMessage = document.getElementById('paymentResultMessage');
const closeModal = document.getElementById('closeModal');

// Function to close the modal
closeModal.onclick = () => {
    modal.style.display = 'none';
};

// Close modal when clicking outside of it
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

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
        // Initiate payment
        const response = await fetch('/api/payments/initiate', { method: 'POST' });
        const { sessionId, redirectUrl, orderId } = await response.json();

        // Redirect to the NBE payment gateway
        window.location.href = `${redirectUrl}?sessionId=${sessionId}`;

        // Periodically check the payment result after redirection
        setTimeout(async () => {
            try {
                const resultResponse = await fetch(`/api/payments/result?orderId=${orderId}`);
                const result = await resultResponse.json();

                // Display the payment result in the modal
                modalMessage.textContent = result.message;
                modal.style.display = 'block';
            } catch (resultError) {
                console.error('Error fetching payment result:', resultError);
                modalMessage.textContent = 'Error retrieving payment result. Please contact support.';
                modal.style.display = 'block';
            }
        }, 10000); // Check the result after 10 seconds
    } catch (error) {
        console.error('Error initiating payment:', error);
        modalMessage.textContent = 'Error initiating payment. Please try again.';
        modal.style.display = 'block';
    }
});

// Fetch booking details on page load to initialize the form
getBookingDetails();
