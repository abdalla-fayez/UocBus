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

// Function to populate dropdowns dynamically
async function populateDropdowns() {
    try {
        const response = await fetch('/api/locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const locations = await response.json();

        // Populate dropdowns
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            departureSelect.appendChild(option);

            const option2 = option.cloneNode(true);
            arrivalSelect.appendChild(option2);
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
                tripElement.textContent = `Trip ID: ${trip.id}, Date: ${trip.trip_date}, Available Seats: ${trip.available_seats}, Route: ${trip.name}`;
                tripsResults.appendChild(tripElement);
            });
        }
    } catch (error) {
        console.error('Error fetching trips:', error);
    }
}

// Function to book a trip
async function bookTrip() {
    try {
        const tripId = tripIdInput.value;
        const seatsBooked = numSeatsInput.value;

        if (!tripId || !seatsBooked || seatsBooked <= 0) {
            alert('Please provide valid Trip ID and Number of Seats!');
            return;
        }

        const response = await fetch('/api/trips/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trip_id: tripId, seats_booked: seatsBooked }),
        });

        const result = await response.json();

        if (response.ok) {
            bookingStatus.textContent = `Booking Successful! Trip ID: ${result.trip_id}, Seats Booked: ${result.seats_booked}`;
        } else {
            bookingStatus.textContent = `Booking Failed: ${result.error || 'Unknown error'}`;
        }
    } catch (error) {
        console.error('Error booking trip:', error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', populateDropdowns);
searchButton.addEventListener('click', searchTrips);
bookButton.addEventListener('click', bookTrip);
