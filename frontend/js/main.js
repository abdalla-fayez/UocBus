const routeSelect = document.getElementById('routeName');
const tripTypeSelect = document.getElementById('tripType');
const dateInput = document.getElementById('tripDate');
const searchButton = document.getElementById('searchTrips');
const errorAlert = document.getElementById('errorAlert'); // Alert container
const errorMessage = document.getElementById('errorMessage'); // Alert text
const tripsResults = document.getElementById('tripsResults'); // Trips container
const tripTemplate = document.getElementById('tripTemplate'); // HTML template

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    populateRouteDropdown();
});
searchButton.addEventListener('click', searchTrips);

// Function to populate route names dropdown
async function populateRouteDropdown() {
    try {
        const response = await fetch('/api/routes/active');
        if (!response.ok) throw new Error('Unable to fetch route data.');

        const { routes } = await response.json();

        // Clear existing options
        routeSelect.innerHTML = '<option selected disabled>Select Route</option>';

        // Populate route names dropdown
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route;
            option.textContent = route;
            routeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating route dropdown:', error);
    }
}

// Function to populate trip types dropdown based on selected route
async function populateTripTypeDropdown(routeName) {
    try {
        const response = await fetch(`/api/routes/trip-types?${new URLSearchParams({ routeName })}`);
        if (!response.ok) throw new Error('Unable to fetch trip type data.');

        const { tripTypes } = await response.json();

        // Clear existing options
        tripTypeSelect.innerHTML = '<option selected disabled>Select Trip Type</option>';

        // Populate trip types dropdown
        tripTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            tripTypeSelect.appendChild(option);
        });

        // Enable the trip type dropdown
        tripTypeSelect.disabled = false;
    } catch (error) {
        console.error('Error populating trip type dropdown:', error);
    }
}

// Add event listener to the route dropdown
routeSelect.addEventListener('change', (event) => {
    const selectedRoute = event.target.value;

    if (selectedRoute) {
        // Fetch and populate trip types for the selected route
        populateTripTypeDropdown(selectedRoute);
    } else {
        // If no route is selected, disable and clear the trip type dropdown
        tripTypeSelect.innerHTML = '<option selected disabled>Select Trip Type</option>';
        tripTypeSelect.disabled = true;
    }
});

// Function to search for trips based on user input and view them
async function searchTrips() {
    try {
        // Hide the error alert before performing a new search
        errorAlert.classList.add('d-none');

        // Retrieve values from input fields
        const route = routeSelect.value;
        const tripType = tripTypeSelect.value;
        const date = dateInput.value;

        // Validate inputs to ensure all fields are filled
        if (!route || !tripType || !date) {
            showError('Please fill in all fields before searching.');
            return;
        }

        // Send a request to the backend API to fetch available trips
        const response = await fetch(`/api/trips/available?${new URLSearchParams({ route })}&tripType=${tripType}&date=${date}`);
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
            clone.querySelector('.trip-type').textContent = trip.trip_type;
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

            // Debug log for pickup points
            console.log('Processing pickup points for trip:', trip);

            // Populate pickup points
            const pickupPointsList = clone.querySelector('.pickup-points-list');
            if (!pickupPointsList) {
                console.warn('Pickup points list element not found in the template.');
            } else {
                trip.pickup_points.forEach((point, index) => {
                    console.log(`Rendering pickup point ${index + 1}:`, point);

                    // Create a list item
                    const listItem = document.createElement('li');

                    // Create the icon element
                    const icon = document.createElement('i');
                    icon.classList.add('bi', 'bi-geo-alt-fill');
                    icon.style.color = 'red';
                    icon.style.marginRight = '5px';

                    // Create the text node for the pickup point
                    const pointText = document.createTextNode(`${point.name} (${point.time})`);

                    // Append icon and text to the list item
                    listItem.appendChild(icon);
                    listItem.appendChild(pointText);

                    // Append the list item to the pickup points list
                    pickupPointsList.appendChild(listItem);

                    console.log('List item added to DOM:', listItem);
                });
                console.log('Final pickup points list for trip:', pickupPointsList.innerHTML);
            }

            // Handle "Book" button click
            clone.querySelector('.book-btn').addEventListener('click', async () => {
                const seatsBooked = Number(seatDropdown.value);
                if (!seatsBooked || isNaN(seatsBooked) || seatsBooked <= 0) {
                  showError('Please select a valid number of seats.');
                  return;
                }

                let globalTicketAllowance;
                try {
                  // Fetch global ticket allowance from the API
                  globalTicketAllowance = await fetchTicketAllowance();
                } catch (error) {
                  console.error('Error fetching global ticket allowance:', error);
                  showError("An error occurred while retrieving the ticket allowance. Please try again later.");
                  return;
                }
                try {
                    // Fetch current ticket count for the logged-in user
                    const response = await fetch('/api/user/ticketsbooked');
                    if (!response.ok) {
                      throw new Error("Failed to fetch user's ticket count.");
                    }
                    const data = await response.json();
                    const currentTickets = Number(data.ticketsBooked);
                    
                    // Check condition A: if user already booked the maximum allowed tickets
                    if (currentTickets >= globalTicketAllowance) {
                      alert("You have already booked the maximum number of tickets allowed this semester.");
                      return;
                    }
                    // Check condition B: if adding new seats exceeds the allowed maximum
                    if ((currentTickets + seatsBooked) > globalTicketAllowance) {
                      alert("Booking these seats would exceed your ticket allowance for this semester.");
                      return;
                    }
                }   catch (error) {
                    console.error('Error fetching user ticket count:', error);
                    showError("An error occurred while checking your ticket count. Please try again later.");
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
                }   catch (error) {
                    console.error('Error storing booking details:', error);
                    showError('An error occurred while processing your booking.');
                    }
            });

            // Append the populated template to the results container
            tripsResults.appendChild(clone);
        });
    
    
    tripsResults.scrollIntoView(); // Focus on the trips results container fix for mobile views
    // tripsResults.focus(); // Focus on the trips results container


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

// Function to fetch the global ticket allowance from the backend
async function fetchTicketAllowance() {
    const response = await fetch('/api/system/maxTicketAllowance');
    if (!response.ok) {
      throw new Error("Failed to fetch ticket allowance");
    }
    const data = await response.json();
    return Number(data.maxTicketAllowance);
}

// // Moved to its own file: frontend/js/userpreview.js
// document.addEventListener('DOMContentLoaded', () => {
//     const profilePhoto = document.getElementById('profilePhoto');
//     const displayNameElement = document.getElementById('displayName');

//     fetch('/api/session/user/retrieve')
//         .then(response => response.json())
//         .then(user => {
//             if (user.photo) {
//                 profilePhoto.src = user.photo;
//             }
//             if (user.displayName) {
//                 displayNameElement.textContent = user.displayName;
//             }
//         })
//         .catch(error => {
//             console.error('Error fetching user data:', error);
//         });
// });

// document.addEventListener('DOMContentLoaded', () => {
//     const logoutButton = document.getElementById('logoutButton');

//     logoutButton.addEventListener('click', (event) => {
//         event.preventDefault();
//         window.location.href = '/api/logout';
//     });
// });