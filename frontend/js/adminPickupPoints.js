// Add Sortable.js library in HTML first
document.addEventListener('DOMContentLoaded', () => {
  const routesContainer = document.getElementById('routesContainer');

  let routesData = [];
  let pickupPointsData = [];

  // Fetch routes and pickup points, then render the UI
  async function fetchData() {
    try {
      // Fetch routes
      const routesResponse = await fetch('/api/admin/routes');
      routesData = await routesResponse.json();

      // Fetch all pickup points
      const pickupResponse = await fetch('/api/admin/pickup_points');
      pickupPointsData = await pickupResponse.json();

      renderRoutes();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Render routes and their associated pickup points
  function renderRoutes() {
    routesContainer.innerHTML = '';

    // Group pickup points by route_id
    const pickupPointsByRoute = {};
    pickupPointsData.forEach(pp => {
      if (!pickupPointsByRoute[pp.route_id]) {
        pickupPointsByRoute[pp.route_id] = [];
      }
      pickupPointsByRoute[pp.route_id].push(pp);
    });

    routesData.forEach(route => {
      // Create a container for this route
      const routeDiv = document.createElement('div');
      routeDiv.classList.add('mb-3');

      // Create a header for the route
      const header = document.createElement('div');
      header.classList.add('route-header');
      header.innerHTML = `Route ID: ${route.id} – ${route.route_name} (${route.trip_type})`;
      
      // Add click handler to toggle the expandable div
      header.addEventListener('click', () => {
        const container = header.nextElementSibling;
        container.style.display = container.style.display === 'block' ? 'none' : 'block';
        header.classList.toggle('expanded');
      });
      
      routeDiv.appendChild(header);

      // Create the expandable container for pickup points
      const expandableDiv = document.createElement('div');
      expandableDiv.classList.add('pickup-points-container');

      // Add table-responsive wrapper
      const tableResponsive = document.createElement('div');
      tableResponsive.classList.add('table-responsive');

      // Create a table for listing pickup points for this route
      const table = document.createElement('table');
      table.classList.add('table', 'table-bordered');
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Time</th>
          <th>Actions</th>
        </tr>
      `;
      table.appendChild(thead);
      const tbody = document.createElement('tbody');

      // Get pickup points for this route (or empty array if none)
      const pickupPoints = pickupPointsByRoute[route.id] || [];
      pickupPoints.forEach(pp => {
        const tr = createPickupPointRow(pp);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableResponsive.appendChild(table);
      expandableDiv.appendChild(tableResponsive);

      // Create a form to add a new pickup point for this route (widened)
      const addForm = document.createElement('form');
      addForm.classList.add('mb-3');
      // Set the form's width to 80% and center it
      addForm.style.width = '80%';
      addForm.style.margin = '0 auto';
      addForm.innerHTML = `
      <div class="form-row align-items-center">
          <div class="col-6">
          <input type="text" class="form-control mb-2 w-100" placeholder="Pickup Point Name" name="name" required>
          </div>
          <div class="col-3">
          <input type="time" class="form-control mb-2 w-100" placeholder="Time" name="time" required>
          </div>
          <div class="col-3">
          <button type="submit" class="btn btn-success mb-2">Add Point</button>
          </div>
      </div>
      `;

      // On form submission, create a new pickup point linked to the current route
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addForm);
        const name = formData.get('name');
        const time = formData.get('time');
        try {
          const response = await fetch('/api/admin/pickup_points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ route_id: route.id, name, time })
          });
          const result = await response.json();
          alert('Pickup point added successfully!');
          await fetchData(); // Refresh the data
        } catch (error) {
          console.error('Error adding pickup point:', error);
        }
      });
      expandableDiv.appendChild(addForm);
      routeDiv.appendChild(expandableDiv);
      routesContainer.appendChild(routeDiv);
    });

    // Add CSV import/export section at the bottom of all routes
    const csvSection = document.createElement('div');
    csvSection.classList.add('mt-5', 'p-4', 'bg-light', 'rounded', 'border');
    csvSection.innerHTML = `
      <div class="alert alert-info mb-3" role="alert">
        <h6 class="alert-heading"><i class="bi bi-info-circle me-2"></i>Bulk Import/Export Pickup Points - رفع/تحميل نقاط التوقف</h6>
        <div class="mb-2">
          <p class="mb-1" dir="ltr"><small>CSV format: route_name, trip_type, name (pickup point), time</small></p>
          <p class="mb-1" dir="rtl" style="font-family: Arial;"><small>صيغة الملف: route_name, trip_type, name, time</small></p>
        </div>
        <div>
          <p class="mb-0"><small><strong>Example/مثال:</strong> "Main Campus Route, To Campus, Gate 1, 08:00"</small></p>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <a href="/api/admin/pickup_points/export" class="btn btn-success">
          <i class="bi bi-download me-1"></i>Export CSV - تحميل
        </a>
        <div class="input-group" style="max-width: 400px;">
          <input type="file" id="csvFile" accept=".csv" class="form-control">
          <button id="uploadCsv" class="btn btn-primary">
            <i class="bi bi-upload me-1"></i>Import - رفع
          </button>
        </div>
      </div>
    `;
    routesContainer.appendChild(csvSection);

    // Add event listener after the section is added to DOM
    document.getElementById('uploadCsv').addEventListener('click', async () => {
      const fileInput = document.getElementById('csvFile');
      if (!fileInput.files[0]) {
        alert('Please select a CSV file first');
        return;
      }

      const formData = new FormData();
      formData.append('csv', fileInput.files[0]);

      try {
        const response = await fetch('/api/admin/pickup_points/import', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        
        if (response.ok) {
          alert(
            `Import Summary:\n` +
            `Added: ${result.summary.added}\n` +
            `Updated: ${result.summary.updated}\n` +
            `Unchanged: ${result.summary.unchanged}\n` +
            `Deleted: ${result.summary.deleted}`
          );
          await fetchData();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        console.error('Error uploading CSV:', error);
        alert('Error uploading CSV file');
      }
    });
  }

  // Create a table row for a pickup point with edit and delete buttons
  function createPickupPointRow(pp) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pp.id}</td>
      <td>${pp.name}</td>
      <td>${pp.time}</td>
      <td>
        <button class="btn btn-primary btn-sm editPickupBtn" data-id="${pp.id}">Edit</button>
        <button class="btn btn-danger btn-sm deletePickupBtn" data-id="${pp.id}">Delete</button>
      </td>
    `;

    // Attach event listener for the Edit button
    const editBtn = tr.querySelector('.editPickupBtn');
    editBtn.addEventListener('click', () => {
      const editRow = createEditPickupFormRow(pp);
      tr.parentNode.replaceChild(editRow, tr);
    });

    // Attach event listener for the Delete button
    const deleteBtn = tr.querySelector('.deletePickupBtn');
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this pickup point?')) {
        try {
          const response = await fetch(`/api/admin/pickup_points/${pp.id}`, { method: 'DELETE' });
          const result = await response.json();
          alert(result.message);
          await fetchData();
        } catch (error) {
          console.error('Error deleting pickup point:', error);
        }
      }
    });

    return tr;
  }

  // Create an inline edit form row for a pickup point
  function createEditPickupFormRow(pp) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pp.id}</td>
      <td><input type="text" class="form-control form-control-sm" value="${pp.name}" required></td>
      <td><input type="time" class="form-control form-control-sm" value="${pp.time}" required></td>
      <td>
        <button class="btn btn-primary btn-sm savePickupBtn">Save</button>
        <button class="btn btn-secondary btn-sm cancelPickupBtn">Cancel</button>
      </td>
    `;
    // Save button: update the pickup point
    tr.querySelector('.savePickupBtn').addEventListener('click', async () => {
      const newName = tr.querySelector('input[type="text"]').value;
      const newTime = tr.querySelector('input[type="time"]').value;
      try {
        const response = await fetch(`/api/admin/pickup_points/${pp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            time: newTime,
            route_id: pp.route_id,
            route_name: pp.route_name,
            trip_type: pp.trip_type
          })
        });
        const result = await response.json();
        alert(result.message);
        await fetchData();
      } catch (error) {
        console.error('Error updating pickup point:', error);
      }
    });
    // Cancel button: revert to original row
    tr.querySelector('.cancelPickupBtn').addEventListener('click', () => {
      const originalRow = createPickupPointRow(pp);
      tr.parentNode.replaceChild(originalRow, tr);
    });
    return tr;
  }

  // Initial data fetch
  fetchData();
});
