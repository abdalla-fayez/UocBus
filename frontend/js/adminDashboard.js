import permissionsManager from './permissions.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize permissions
  await permissionsManager.init();
  
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
  // Report Generation UI based on Permissions
  // --------------------------

  // Create report section if user has either permission
  if (permissionsManager.hasPermission('generate_reports_fleet') || 
      permissionsManager.hasPermission('generate_reports_finance')) {
      
      const reportSection = document.createElement('div');
      reportSection.className = 'mb-3';
      
      let reportHTML = `<div class="row">`;
      
      // Add Bookings Report UI if user has permission
      if (permissionsManager.hasPermission('generate_reports_fleet')) {
          reportHTML += `
              <div class="col-md-6 mb-3">
                  <div class="card">
                      <div class="card-header">
                          <h5 class="card-title mb-0">Bookings Report</h5>
                      </div>
                      <div class="card-body">
                          <div class="form-group mb-2">
                              <label>Date Range:</label>
                              <div class="d-flex gap-2">
                                  <input type="date" id="bookingsReportFromDate" class="form-control" placeholder="From Date">
                                  <input type="date" id="bookingsReportToDate" class="form-control" placeholder="To Date">
                              </div>
                          </div>
                          <button id="generateBookingsReport" class="btn btn-primary">Generate Bookings Report</button>
                      </div>
                  </div>
              </div>`;
      }
      
      // Add Payments Report UI if user has permission
      if (permissionsManager.hasPermission('generate_reports_finance')) {
          reportHTML += `
              <div class="col-md-6 mb-3">
                  <div class="card">
                      <div class="card-header">
                          <h5 class="card-title mb-0">Payments Report</h5>
                      </div>
                      <div class="card-body">
                          <div class="form-group mb-2">
                              <label>Date Range:</label>
                              <div class="d-flex gap-2">
                                  <input type="date" id="paymentsReportFromDate" class="form-control" placeholder="From Date">
                                  <input type="date" id="paymentsReportToDate" class="form-control" placeholder="To Date">
                              </div>
                          </div>
                          <button id="generatePaymentsReport" class="btn btn-primary">Generate Payments Report</button>
                      </div>
                  </div>
              </div>`;
      }
      
      reportHTML += `</div>`;
      reportSection.innerHTML = reportHTML;
      bookingsSection.insertBefore(reportSection, bookingsSection.firstChild);

      // Add event listeners if the elements exist
      const bookingsReportBtn = document.getElementById('generateBookingsReport');
      const paymentsReportBtn = document.getElementById('generatePaymentsReport');

      // Bookings Report Event Handler
      if (bookingsReportBtn) {
          bookingsReportBtn.addEventListener('click', async () => {
              const fromDate = document.getElementById('bookingsReportFromDate').value;
              const toDate = document.getElementById('bookingsReportToDate').value;
              
              if (!fromDate || !toDate) {
                  alert('Please select both From and To dates');
                  return;
              }
              
              if (new Date(fromDate) > new Date(toDate)) {
                  alert('From date cannot be later than To date');
                  return;
              }

              try {
                  const response = await permissionsManager.fetchWithPermission(
                      `/api/admin/dailybookingsreport?fromDate=${fromDate}&toDate=${toDate}`
                  );
                  const contentType = response.headers.get('content-type');
                  
                  if (response.ok) {
                      if (contentType && contentType.indexOf("application/json") !== -1) {
                          const data = await response.json();
                          if(data.message) {
                              alert(data.message);
                          } else if(data.error) {
                              alert(data.error);
                          }
                      } else {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `bookings-report-${fromDate}-to-${toDate}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                      }
                  } else {
                      if (contentType && contentType.indexOf("application/json") !== -1) {
                          const error = await response.json();
                          alert(error.message || 'Failed to generate bookings report');
                      } else {
                          alert('Failed to generate bookings report');
                      }
                  }
              } catch (error) {
                  console.error('Error generating bookings report:', error);
                  alert('Error generating bookings report');
              }
          });
      }

      // Payments Report Event Handler
      if (paymentsReportBtn) {
          paymentsReportBtn.addEventListener('click', async () => {
              const fromDate = document.getElementById('paymentsReportFromDate').value;
              const toDate = document.getElementById('paymentsReportToDate').value;
              
              if (!fromDate || !toDate) {
                  alert('Please select both From and To dates');
                  return;
              }
              
              if (new Date(fromDate) > new Date(toDate)) {
                  alert('From date cannot be later than To date');
                  return;
              }

              try {
                  const response = await permissionsManager.fetchWithPermission(
                      `/api/admin/dailypaymentsreport?fromDate=${fromDate}&toDate=${toDate}`
                  );
                  const contentType = response.headers.get('content-type');
                  
                  if (response.ok) {
                      if (contentType && contentType.indexOf("application/json") !== -1) {
                          const data = await response.json();
                          if(data.message) {
                              alert(data.message);
                          } else if(data.error) {
                              alert(data.error);
                          }
                      } else {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `payments-report-${fromDate}-to-${toDate}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                      }
                  } else {
                      if (contentType && contentType.indexOf("application/json") !== -1) {
                          const error = await response.json();
                          alert(error.message || 'Failed to generate payments report');
                      } else {
                          alert('Failed to generate payments report');
                      }
                  }
              } catch (error) {
                  console.error('Error generating payments report:', error);
                  alert('Error generating payments report');
              }
          });
      }
  }

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

    // Custom formatter function for Cairo time
    function formatDateToCairo(date) {
        const utcDate = new Date(date);
        // Adjust to Cairo time (UTC+2)
        const cairoOffset = -3;
        utcDate.setHours(utcDate.getHours() + cairoOffset);
        
        const day = utcDate.getDate().toString().padStart(2, '0');
        const month = (utcDate.getMonth() + 1).toString().padStart(2, '0');
        const year = utcDate.getFullYear();
        const hours = utcDate.getHours().toString().padStart(2, '0');
        const minutes = utcDate.getMinutes().toString().padStart(2, '0');
        const seconds = utcDate.getSeconds().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    bookings.forEach(booking => {
        const formattedCreatedAt = formatDateToCairo(booking.created_at);

        // Format trip_date: if it's "N/A", leave as is; otherwise format as date
        let formattedTripDate = booking.trip_date;
        if (booking.trip_date !== 'N/A') {
            const tripDate = new Date(booking.trip_date);
            formattedTripDate = `${tripDate.getDate().toString().padStart(2, '0')}/${(tripDate.getMonth() + 1).toString().padStart(2, '0')}/${tripDate.getFullYear()}`;
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
      order: [[0, 'desc']] // Order by first column (ID) descending
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
