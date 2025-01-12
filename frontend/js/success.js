console.log('Starting success.js');

// Get orderId from the URL
const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');

console.log('Order ID:', orderId);

// Define paths and elements
const downloadLink = document.getElementById('downloadLink');
const studentName = document.getElementById('studentName');
const studentId = document.getElementById('studentId');
const studentEmail = document.getElementById('studentEmail');
const studentMobile = document.getElementById('studentMobile');
const routeName = document.getElementById('routeName');
const tripType = document.getElementById('trip-time');
const tripDate = document.getElementById('tripDate');
const seatsBooked = document.getElementById('seatsBooked');
const totalAmount = document.getElementById('totalAmount');
const ticketNumber = document.getElementById('ticketNumber');
const loadingIndicator = document.getElementById('loading');
const ticketDetails = document.getElementById('ticketDetails');
const errorMessage = document.getElementById('errorMessage');

// Utility to safely set element content
const safeSetContent = (element, content) => {
    if (element) {
        element.textContent = content || 'N/A';
    }
};

// Utility to show errors
const showError = (message) => {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
};

// Start with a loading state
if (loadingIndicator) loadingIndicator.style.display = 'block';
if (ticketDetails) ticketDetails.style.display = 'none';

if (orderId) {
    const ticketPath = `../assets/tickets/${orderId}.pdf`;

    console.log('Fetching booking details...');

    // Fetch booking details
    fetch(`/api/bookings/details?orderId=${orderId}`)
        .then((response) => {
            console.log('API Response:', response);
            if (!response.ok) {
                throw new Error('Failed to fetch booking details.');
            }
            return response.json();
        })
        .then((data) => {
            console.log('Fetched Data:', data);
            if (data) {
                // Populate ticket details
                safeSetContent(studentName, data.student_name);
                safeSetContent(studentId, data.student_id);
                safeSetContent(studentEmail, data.student_email);
                safeSetContent(studentMobile, data.student_mobile_no);
                safeSetContent(routeName, data.route_name);
                safeSetContent(tripType, data.trip_type);
                safeSetContent(tripDate, new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(data.trip_date)));
                safeSetContent(seatsBooked, data.seats_booked);
                safeSetContent(totalAmount, data.total_amount);
                safeSetContent(ticketNumber, data.order_id);

                // Update download link
                downloadLink.href = ticketPath;
                downloadLink.download = `${orderId}.pdf`;

                // Show the ticket details and hide the loader
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                if (ticketDetails) ticketDetails.style.display = 'block';
            } else {
                showError('No ticket details found.');
                alert('Error fetching ticket details.');
            }
        })
        .catch((error) => {
            console.error('Error fetching booking details:', error);
            showError('An error occurred while fetching ticket details.');
        });
} else {
    showError('No ticket information found.');
    alert('No ticket information found.');
}
