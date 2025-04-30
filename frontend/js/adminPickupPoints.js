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

      // Append the expandable container to the route container
      routeDiv.appendChild(expandableDiv);

      // Toggle the expandable container on header click
      header.addEventListener('click', () => {
        expandableDiv.style.display = expandableDiv.style.display === 'block' ? 'none' : 'block';
      });

      routesContainer.appendChild(routeDiv);
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
          body: JSON.stringify({ name: newName, time: newTime })
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
