// Select DOM elements
const routeName = document.getElementById('routeName');
const tripType = document.getElementById('tripType');
const tripDate = document.getElementById('tripDate');
const seatCount = document.getElementById('seatCount');
const pricePerSeat = document.getElementById('pricePerSeat');
const totalAmount = document.getElementById('totalAmount');
const proceedButton = document.getElementById('proceedToPayment');
const tosCheckbox = document.getElementById('tosCheckbox');
const tosError = document.getElementById('tosError');

// Event listener for page load
document.addEventListener('DOMContentLoaded', populateBookingDetails);
proceedButton.removeEventListener('click', handleProceedToPayment);
proceedButton.addEventListener('click', handleProceedToPayment);

// Hide error when user toggles the checkbox on
tosCheckbox.addEventListener('change', () => {
    if (tosCheckbox.checked) {
      tosError.classList.add('d-none');
    }
});

// Function to populate booking details
async function populateBookingDetails() {
    try {
        // Fetch stored booking data from the backend session
        const responseBooking = await fetch('/api/session/booking/retrieve');
        if (!responseBooking.ok) throw new Error('Failed to fetch booking details.');

        const bookingData = await responseBooking.json();

        const responseUser = await fetch('/api/session/user/retrieve');
        if (!responseUser.ok) throw new Error('Failed to fetch user details.');

        const userData = await responseUser.json();
        
        // Populate the placeholders in the user details card
        userName.textContent = userData.displayName;
        userId.textContent = userData.jobTitle;
        userEmail.textContent = userData.email;
        // Populate the placeholders in the booking details card
        routeName.textContent = bookingData.routeName;
        tripType.textContent = bookingData.tripType;
        tripDate.textContent = bookingData.tripDate;
        seatCount.textContent = bookingData.seatsBooked;
        pricePerSeat.textContent = bookingData.ticketPrice;
        totalAmount.textContent = bookingData.amountPayable;
    } catch (error) {
        console.error('Error populating booking details:', error);
        alert('Failed to load booking details. Please try again.');
    }
}

// Function to handle "Proceed to Checkout"
async function handleProceedToPayment() {
    try {
        // Validate TOS agreement
        if (!tosCheckbox.checked) {
            tosError.classList.remove('d-none');
            return;
        }

        // Hide the error if it was visible
        tosError.classList.add('d-none');

        // Send request to create booking
        const storeResponse = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!storeResponse.ok) throw new Error('Failed to store booking details.');

        console.log('Booking details stored successfully.');

        // Call the payments initiate API
        const paymentResponse = await fetch('/api/payments/initiate', {
            method: 'POST',
        });
        
        const { sessionId, orderId: generatedOrderId } = await paymentResponse.json();

        if (!sessionId || !generatedOrderId) {
            throw new Error('Failed to initiate payment. Missing sessionId or orderId.');
        }
        if (!paymentResponse.ok) throw new Error('Failed to initiate payment.');

        orderId = generatedOrderId;

        console.log('Payment initiation successful:', { sessionId, orderId });

        // Configure hosted checkout
        Checkout.configure({
            session: { id: sessionId },
        });
        // Display embedded hosted checkout form
        Checkout.showLightbox('#checkoutContainer');
    } catch (error) {
        console.error('Error during checkout process:', error);
        alert('An error occurred. Please try again.');
    }
};