// Initialize variables for DOM elements
const departureSelect = document.getElementById('departure');
const arrivalSelect = document.getElementById('arrival');
const dateInput = document.getElementById('date');
const searchButton = document.getElementById('searchTrips');
const tripsResults = document.getElementById('tripsResults');
const tripIdInput = document.getElementById('tripId');
const numSeatsInput = document.getElementById('numSeats');
const bookButton = document.getElementById('bookTrip');
const bookingStatus = document.getElementById('bookingStatus');

// Event listeners
document.addEventListener('DOMContentLoaded', populateDropdowns);
searchButton.addEventListener('click', searchTrips);
bookButton.addEventListener('click', redirectToPayment);

// Function to populate dropdowns dynamically
async function populateDropdowns() {
    try {
        const response = await fetch('/api/locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const { departure, arrival } = await response.json();

        // Populate departure dropdown
        departure.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            departureSelect.appendChild(option);
        });

        // Populate arrival dropdown
        arrival.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            arrivalSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating dropdowns:', error);
    }
}

// Function to search for available trips
async function searchTrips() {
    try {
        const departure = departureSelect.value;
        const arrival = arrivalSelect.value;
        const date = dateInput.value;

        if (!departure || !arrival || !date) {
            alert('Please fill in all fields!');
            return;
        }

        const response = await fetch(`/api/trips/available?departure=${departure}&arrival=${arrival}&date=${date}`);
        if (!response.ok) throw new Error('Failed to fetch trips');
        const trips = await response.json();

        tripsResults.innerHTML = ''; // Clear previous results
        if (trips.length === 0) {
            tripsResults.textContent = 'No trips available for the selected criteria.';
        } else {
            trips.forEach(trip => {
                const tripElement = document.createElement('div');
                tripElement.textContent = `Trip ID: ${trip.id}, Date: ${trip.trip_date}, Available Seats: ${trip.available_seats}, Route: ${trip.route_name}`;
                tripsResults.appendChild(tripElement);
            });
        }
    } catch (error) {
        console.error('Error fetching trips:', error);
    }
}

// Function to redirect to payment
async function redirectToPayment() {
    const tripId = tripIdInput.value;
    const seatsBooked = numSeatsInput.value;

    if (!tripId || !seatsBooked || seatsBooked <= 0) {
        alert('Please provide valid Trip ID and Number of Seats!');
        return;
    }

    try {
        // Store trip details in the backend session
        const response = await fetch('/api/session/booking/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId, seatsBooked }),
        });

        if (response.ok) {
            // Redirect to payment.html without exposing details
            window.location.href = 'payment.html';
        } else {
            console.error('Failed to store session data');
            alert('An error occurred while processing your request.');
        }
    } catch (error) {
        console.error('Error redirecting to payment:', error);
        alert('An error occurred while redirecting to the payment page.');
    }
}
