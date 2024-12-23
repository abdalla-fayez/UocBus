const departureSelect = document.getElementById('fromLocation');
const arrivalSelect = document.getElementById('toLocation');
const dateInput = document.getElementById('tripDate');
const searchButton = document.getElementById('searchTrips');
const errorAlert = document.getElementById('errorAlert'); // Alert container
const errorMessage = document.getElementById('errorMessage'); // Alert text
const tripsResults = document.getElementById('tripsResults'); // Trips container
const tripTemplate = document.getElementById('tripTemplate'); // HTML template

// Event listeners
document.addEventListener('DOMContentLoaded', populateDropdowns);
searchButton.addEventListener('click', searchTrips);

// Function to populate dropdowns dynamically
async function populateDropdowns() {
    try {
        const response = await fetch('/api/locations');
        if (!response.ok) throw new Error('Unable to fetch data. Please try again later.');
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

// Function to search for trips based on user input
async function searchTrips() {
    try {
        // Hide the error alert before performing a new search
        errorAlert.classList.add('d-none');

        // Retrieve values from input fields
        const departure = departureSelect.value;
        const arrival = arrivalSelect.value;
        const date = dateInput.value;

        // Validate inputs to ensure all fields are filled
        if (!departure || !arrival || !date) {
            showError('Please fill in all fields before searching.');
            return;
        }

        // Send a request to the backend API to fetch available trips
        const response = await fetch(`/api/trips/available?departure=${departure}&arrival=${arrival}&date=${date}`);
        if (!response.ok) throw new Error('Unable to fetch data. Please try again later.');

        const trips = await response.json(); // Parse the JSON response

        // Display a message if no trips are found
        tripsResults.innerHTML = ''; // Clear previous results
        if (trips.length === 0) {
            showError('Sorry, no trips with vacant seats are available for the selected route and date.');
            return;
        }

        // Display trip results dynamically
        trips.forEach(trip => {
            // Clone the template
            const clone = document.importNode(tripTemplate.content, true);

            // Populate trip details
            clone.querySelector('.route-name').textContent = trip.route_name;
            clone.querySelector('.trip-date').textContent = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(trip.trip_date));
            clone.querySelector('.available-seats').textContent = trip.available_seats;
            clone.querySelector('.trip-price').textContent = trip.price;

            // Populate seat dropdown
            const seatDropdown = clone.querySelector('.seat-dropdown');
            for (let i = 1; i <= trip.available_seats; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                seatDropdown.appendChild(option);
            }

            // Handle "Book" button click
            clone.querySelector('.book-btn').addEventListener('click', async () => {
                const seatsBooked = seatDropdown.value;
                if (!seatsBooked) {
                    showError('Please select a valid number of seats.');
                    return;
                }

                try {
                    const storeResponse = await fetch('/api/session/booking/store', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tripId: trip.id, seatsBooked }),
                    });

                    if (storeResponse.ok) {
                        window.location.href = 'checkout.html'; // Redirect to checkout page
                    } else {
                        showError('Failed to process your booking. Please try again.');
                    }
                } catch (error) {
                    console.error('Error storing booking details:', error);
                    showError('An error occurred while processing your booking.');
                }
            });

            // Append the populated template to the results container
            tripsResults.appendChild(clone);
        });
    } catch (error) {
        console.error('An error occurred while fetching trips:', error);
        showError('Something went wrong while fetching trips. Please try again later.');
    }

    // Function to show error messages in the alert container
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none'); // Show the alert
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event triggered'); // Log to confirm event execution

    const params = new URLSearchParams(window.location.search);
    console.log('Query parameters:', params.toString()); // Log the query parameters

    const alertMessage = document.getElementById('alertMessage');
    console.log('Alert message element:', alertMessage); // Verify the element is selected

    if (params.has('payment')) {
        console.log('Payment status detected'); // Log to confirm query parameter detection

        const paymentStatus = params.get('payment');
        let message = '';

        if (paymentStatus === 'cancelled') {
            message = 'Payment was cancelled.';
        } else if (paymentStatus === 'error') {
            message = 'An error occurred during payment.';
        }

        console.log('Generated message:', message); // Log the message to confirm logic

        if (message) {
            alertMessage.textContent = message;
            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-warning'); // Add the Bootstrap warning style
        }
    }
});

