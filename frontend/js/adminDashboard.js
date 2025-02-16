document.addEventListener('DOMContentLoaded', () => {
  // --------------------------
  // Tab Switching Functionality
  // --------------------------
  const bookingsTab = document.getElementById('bookingsTab');
  const tripsTab = document.getElementById('tripsTab');
  const bookingsSection = document.getElementById('bookingsSection');
  const tripsSection = document.getElementById('tripsSection');

  bookingsTab.addEventListener('click', (e) => {
    e.preventDefault();
    bookingsTab.classList.add('active');
    tripsTab.classList.remove('active');
    bookingsSection.style.display = 'block';
    tripsSection.style.display = 'none';
  });

  tripsTab.addEventListener('click', (e) => {
    e.preventDefault();
    tripsTab.classList.add('active');
    bookingsTab.classList.remove('active');
    bookingsSection.style.display = 'none';
    tripsSection.style.display = 'block';
    // (Optional) You can refetch trips here if needed.
  });

  // --------------------------
  // Fetch and Render Bookings
  // --------------------------
  let bookingsData = [];
  let currentBookingsSortColumn = 'id';
  let currentBookingsSortOrder = 'desc'; // "asc" or "desc"

  async function fetchBookings() {
    try {
      const response = await fetch('/api/admin/dashboard/bookings');
      bookingsData = await response.json();
      sortAndRenderBookings(currentBookingsSortColumn, currentBookingsSortOrder);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }

  function renderBookings(bookings) {
    const tbody = document.querySelector('#bookingsTable tbody');
    tbody.innerHTML = '';
    
    // Formatter for created_at in dd/mm/yyyy HH:MM:SS format (adjusted by subtracting 2 hours)
    const createdAtFormatter = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Africa/Cairo'
    });
    
    // Formatter for trip_date (using short date style)
    const tripDateFormatter = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'short',
      timeZone: 'Africa/Cairo'
    });
    
    bookings.forEach(booking => {
      // Adjust created_at: subtract 2 hours
      const createdAt = new Date(new Date(booking.created_at).getTime() - 7200000);
      const formattedCreatedAt = createdAtFormatter.format(createdAt);
      
      // Format trip_date: if the value is "N/A", keep it; otherwise format the date
      let formattedTripDate = booking.trip_date;
      if (booking.trip_date !== 'N/A') {
        formattedTripDate = tripDateFormatter.format(new Date(booking.trip_date));
      }
      
      // Compute the "Trip" as a combination of route_name and trip_type, using "N/A" if missing
      const tripCombined = `${booking.route_name} (${booking.trip_type})`;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${booking.id}</td>
        <td>${booking.order_id || 'N/A'}</td>
        <td>${booking.student_name}</td>
        <td>${booking.student_id || 'N/A'}</td>
        <td>${booking.student_email}</td>
        <td>${tripCombined || 'N/A'}</td>
        <td>${formattedTripDate}</td>
        <td>${booking.seats_booked || 'N/A'}</td>
        <td>${booking.payment_status || 'N/A'}</td>
        <td>${formattedCreatedAt}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  

  function sortAndRenderBookings(column, order) {
    const sortedBookings = bookingsData.sort((a, b) => {
      let valA, valB;
      
      if (column === 'created_at') {
        // For created_at, convert to Date objects
        valA = new Date(a.created_at);
        valB = new Date(b.created_at);
      } else if (column === 'id') {
        // Numeric comparison for ID
        valA = Number(a.id);
        valB = Number(b.id);
      } else if (column === 'trip_date') {
        // For trip_date, if the value is "N/A", use 0, otherwise use the timestamp
        valA = (a.trip_date === 'N/A') ? 0 : new Date(a.trip_date).getTime();
        valB = (b.trip_date === 'N/A') ? 0 : new Date(b.trip_date).getTime();
      } else if (column === 'trip') {
        // For the computed "Trip" column, combine route_name and trip_type (if missing, default to "N/A")
        valA = ((a.route_name || 'N/A') + " " + (a.trip_type || 'N/A')).toLowerCase();
        valB = ((b.route_name || 'N/A') + " " + (b.trip_type || 'N/A')).toLowerCase();
      } else {
        // For any other column, do a basic comparison
        valA = a[column];
        valB = b[column];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
      }
      
      if (valA < valB) {
        return order === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    renderBookings(sortedBookings);
  }
  

  // Attach click event listeners to sortable headers in bookings table
  const bookingsHeaders = document.querySelectorAll('#bookingsTable th.sortable');
  bookingsHeaders.forEach(header => {
    header.addEventListener('click', () => {
      let sortColumn;
      switch (header.textContent.trim()) {
        case 'ID':
          sortColumn = 'id';
          break;
        case 'Created At':
          sortColumn = 'created_at';
          break;
        case 'Trip Date':
          sortColumn = 'trip_date';
          break;
        case 'Trip':
          sortColumn = 'trip';
          break;
        default:
          sortColumn = 'id';
      }
      // Toggle sort order if the same column is clicked again
      if (currentBookingsSortColumn === sortColumn) {
        currentBookingsSortOrder = currentBookingsSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentBookingsSortColumn = sortColumn;
        currentBookingsSortOrder = 'asc';
      }
      sortAndRenderBookings(currentBookingsSortColumn, currentBookingsSortOrder);
    });
  });

  // --------------------------
  // Fetch and Render Upcoming Trips
  // --------------------------
  let tripsData = [];
  let currentSortColumn = 'trip_date';
  let currentSortOrder = 'desc'; // "asc" or "desc"

  async function fetchTrips() {
    try {
      const response = await fetch('/api/admin/dashboard/trips');
      tripsData = await response.json();
      sortAndRenderTrips(currentSortColumn, currentSortOrder);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  }

  function renderTrips(trips) {
    const tbody = document.querySelector('#tripsTable tbody');
    tbody.innerHTML = '';
    trips.forEach(trip => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${trip.id}</td>
        <td>${trip.route_name}</td>
        <td>${trip.trip_type}</td>
        <td>${new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(trip.trip_date))}</td>
        <td>${trip.trip_time}</td>
        <td>${trip.available_seats}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function sortAndRenderTrips(column, order) {
    const sortedTrips = tripsData.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      // Convert dates for proper comparison
      if (column === 'trip_date') {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      // Compare as lowercase strings if applicable
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) {
        return order === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
    renderTrips(sortedTrips);
  }

  // Attach click events for sortable columns in trips table
  const sortableHeaders = document.querySelectorAll('#tripsTable th.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      let sortColumn;
      switch (header.textContent.trim()) {
        case 'ID':
          sortColumn = 'id';
          break;
        case 'Date':
          sortColumn = 'trip_date';
          break;
        case 'Time':
          sortColumn = 'trip_time';
          break;
        case 'Route Name':
          sortColumn = 'route_name';
          break;
        case 'Trip Type':
          sortColumn = 'trip_type';
          break;
        default:
          sortColumn = 'trip_date';
      }
      // Toggle sort order if same column clicked again
      if (currentSortColumn === sortColumn) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = sortColumn;
        currentSortOrder = 'asc';
      }
      sortAndRenderTrips(currentSortColumn, currentSortOrder);
    });
  });

  // --------------------------
  // Initial Data Fetch
  // --------------------------
  fetchBookings();
  fetchTrips();
});
