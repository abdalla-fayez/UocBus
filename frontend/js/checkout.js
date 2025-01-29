// Select DOM elements
const routeName = document.getElementById('routeName');
const tripType = document.getElementById('tripType');
const tripDate = document.getElementById('tripDate');
const seatCount = document.getElementById('seatCount');
const pricePerSeat = document.getElementById('pricePerSeat');
const totalAmount = document.getElementById('totalAmount');

const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userId = document.getElementById('userId');
const userMobile = document.getElementById('userMobile'); 
const proceedButton = document.getElementById('proceedToPayment');

// Event listener for page load
document.addEventListener('DOMContentLoaded', populateBookingDetails);
proceedButton.addEventListener('click', handleProceedToPayment);

// Function to populate booking details
async function populateBookingDetails() {
    try {
        // Fetch stored booking data from the backend session
        const response = await fetch('/api/session/booking/retrieve');
        if (!response.ok) throw new Error('Failed to fetch booking details.');

        const bookingData = await response.json();
        
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
        // Validate user input
        if (!validateUserDetails()) {
            return; // Stop if the validation fails
        }

        // Send user details to the backend to store in the bookings table
        const userDetails = {
            studentName: userName.value,
            studentEmail: userEmail.value,
            studentId: userId.value,
            studentMobileNo: userMobile.value, // Will still send this even without length or correctness validation
        };

        const storeResponse = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userDetails),
        });

        if (!storeResponse.ok) throw new Error('Failed to store user details.');

        console.log('User details stored successfully.');

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

// Call handlePaymentSuccess after successful payment confirmation
async function handlePaymentSuccess(orderId) {
    try {
        // Show the ticket download section
        const ticketSection = document.getElementById('ticketSection');
        const downloadLink = document.getElementById('downloadTicketLink');

        // Update the download link
        downloadLink.href = `/api/tickets/${orderId}`;
        ticketSection.classList.remove('d-none');
    } catch (error) {
        console.error('Error handling payment success:', error);
    }
}

// Updated: Function to validate user input
function validateUserDetails() {
    let isValid = true;

    // Clear previous error messages
    document.querySelectorAll('.text-danger').forEach(errorElement => {
        errorElement.textContent = '';
        errorElement.classList.add('d-none');
    });

    // Name Validation: At least 3 characters
    if (userName.value.trim().length < 3) {
        const userNameError = document.getElementById('userNameError');
        userNameError.textContent = 'Name must be at least 3 characters long.';
        userNameError.classList.remove('d-none');
        isValid = false;
    }

    // Email Validation: Basic regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.value.trim())) {
        const userEmailError = document.getElementById('userEmailError');
        userEmailError.textContent = 'Please enter a valid email address.';
        userEmailError.classList.remove('d-none');
        isValid = false;
    }

    // Student ID Validation: Must be exactly 9 digits
    const studentIdRegex = /^\d{9}$/;
    if (!studentIdRegex.test(userId.value.trim())) {
        const userIdError = document.getElementById('userIdError');
        userIdError.textContent = 'Student ID must be exactly 9 digits.';
        userIdError.classList.remove('d-none');
        isValid = false;
    }

    // Mobile Number Validation: Ensure it’s not empty
    if (!userMobile.value.trim()) {
        const userMobileError = document.getElementById('userMobileError');
        userMobileError.textContent = 'Please enter your mobile number.';
        userMobileError.classList.remove('d-none');
        isValid = false;
    }

    return isValid;
}
