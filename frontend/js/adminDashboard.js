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
    fetchBookings();
  });

  tripsTab.addEventListener('click', (e) => {
    e.preventDefault();
    tripsTab.classList.add('active');
    bookingsTab.classList.remove('active');
    bookingsSection.style.display = 'none';
    tripsSection.style.display = 'block';
    fetchTrips();
    // (Optional) Can refetch trips here if needed. (done above)
  });
  
  // --------------------------
  // Fetch and Render Bookings using DataTables
  // --------------------------
  let bookingsData = [];

  async function fetchBookings() {
    try {
      const response = await fetch('/api/admin/dashboard/bookings');
      bookingsData = await response.json();
      renderBookings(bookingsData);
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

      // Format trip_date: if it's "N/A", leave as is; otherwise format as date
      let formattedTripDate = booking.trip_date;
      if (booking.trip_date !== 'N/A') {
        formattedTripDate = tripDateFormatter.format(new Date(booking.trip_date));
      }

      // Compute the "Trip" as route_name and trip_type combination
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

    // If DataTable is already initialized on #bookingsTable, destroy it first.
    if ($.fn.DataTable.isDataTable('#bookingsTable')) {
      $('#bookingsTable').DataTable().destroy();
    }

    // Initialize DataTables on the bookings table.
    $('#bookingsTable').DataTable({
      pageLength: 10,
      lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "All"] ],
      order: [] // Let DataTables handle default ordering.
    });
  }

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
