// Initialize variables for DOM elements
// const departureSelect = document.getElementById('departure');
// const arrivalSelect = document.getElementById('arrival');
// const dateInput = document.getElementById('date');
// const searchButton = document.getElementById('searchTrips');
// const tripIdInput = document.getElementById('tripId');
// const numSeatsInput = document.getElementById('numSeats');
// const bookButton = document.getElementById('bookTrip');
// const bookingStatus = document.getElementById('bookingStatus');
// const errorAlert = document.getElementById('errorAlert'); // Alert container
// const errorMessage = document.getElementById('errorMessage'); // Alert text
// const tripsResults = document.getElementById('tripsResults'); // Trips container
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
// bookButton.addEventListener('click', redirectToPayment);

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
            clone.querySelector('.trip-date').textContent = trip.trip_date;
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


// // Function to redirect to payment
// async function redirectToPayment() {
//     const tripId = tripIdInput.value;
//     const seatsBooked = numSeatsInput.value;

//     if (!tripId || !seatsBooked || seatsBooked <= 0) {
//         alert('Please provide valid Trip ID and Number of Seats!');
//         return;
//     }

//     try {
//         // Store trip details in the backend session
//         const response = await fetch('/api/session/booking/store', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ tripId, seatsBooked }),
//         });

//         if (response.ok) {
//             // Redirect to payment.html without exposing details
//             window.location.href = 'checkout.html';
//         } else {
//             console.error('Failed to store session data');
//             alert('An error occurred while processing your request.');
//         }
//     } catch (error) {
//         console.error('Error redirecting to payment:', error);
//         alert('An error occurred while redirecting to the payment page.');
//     }
// }
