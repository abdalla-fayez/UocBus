document.addEventListener('DOMContentLoaded', () => {
    const routesTableBody = document.querySelector('#routesTable tbody');
    const addRouteForm = document.getElementById('addRouteForm');
    
    let routesData = []; // Stores the fetched routes
    let busList = [];    // Stores the fetched buses
  
    // Fetch bus list for populating drop-downs in the inline edit forms
    async function fetchBusList() {
      try {
        const response = await fetch('/api/admin/buses');
        busList = await response.json();
        populateBusSelects(); // (If needed for the add form)
      } catch (error) {
        console.error('Error fetching bus list:', error);
      }
    }
  
    // Populate the bus drop-down in the add route form
    function populateBusSelects() {
      const newRouteBusSelect = document.getElementById('newRouteBusId');
      newRouteBusSelect.innerHTML = '';
      busList.forEach(bus => {
        const option = document.createElement('option');
        option.value = bus.id;
        option.textContent = bus.name;
        newRouteBusSelect.appendChild(option);
      });
    }
  
    // Fetch routes from API
    async function fetchRoutes() {
      try {
        const response = await fetch('/api/admin/routes');
        routesData = await response.json();
        renderRoutes(routesData);
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    }
  
    // Render routes into the table by creating a row for each route
    function renderRoutes(routes) {
      routesTableBody.innerHTML = '';
      routes.forEach(route => {
        const row = createRouteRow(route);
        routesTableBody.appendChild(row);
      });
    }
  
    // Create a normal table row for a route
    function createRouteRow(route) {
      const tr = document.createElement('tr');
      // Look up bus name by bus_id
      const bus = busList.find(b => b.id == route.bus_id);
      const busName = bus ? bus.name : 'N/A';
      tr.innerHTML = `
        <td>${route.id}</td>
        <td>${route.route_name}</td>
        <td>${route.trip_type}</td>
        <td>${busName}</td>
        <td>${route.price}</td>
        <td>${route.time}</td>
        <td>${route.status}</td>
        <td>
          <button class="btn btn-primary btn-sm editRouteBtn" data-id="${route.id}">Edit</button>
          <button class="btn btn-danger btn-sm deleteRouteBtn" data-id="${route.id}">Delete</button>
        </td>
      `;
      // Attach event listener for "Edit"
      tr.querySelector('.editRouteBtn').addEventListener('click', () => {
        const editRow = createEditRouteRow(route);
        tr.parentNode.replaceChild(editRow, tr);
      });
      // Attach event listener for "Delete"
      tr.querySelector('.deleteRouteBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this route?')) {
          try {
            const response = await fetch(`/api/admin/routes/${route.id}`, { method: 'DELETE' });
            const result = await response.json();
            alert(result.message);
            fetchRoutes();
          } catch (error) {
            console.error('Error deleting route:', error);
          }
        }
      });
      return tr;
    }
  
    // Create an inline edit form row for a route
    function createEditRouteRow(route) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${route.id}</td>
        <td><input type="text" class="form-control form-control-sm routeName" value="${route.route_name}" required></td>
        <td>
          <select class="form-control form-control-sm routeTripType" required>
            <option value="To Campus" ${route.trip_type === 'To Campus' ? 'selected' : ''}>To Campus</option>
            <option value="From Campus" ${route.trip_type === 'From Campus' ? 'selected' : ''}>From Campus</option>
          </select>
        </td>
        <td>
          <select class="form-control form-control-sm routeBusId" required>
            ${busList.map(bus => `<option value="${bus.id}" ${bus.id == route.bus_id ? 'selected' : ''}>${bus.name}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" step="0.01" class="form-control form-control-sm routePrice" value="${route.price}" required></td>
        <td><input type="time" class="form-control form-control-sm routeTime" value="${route.time}" required></td>
        <td>
          <select class="form-control form-control-sm routeStatus" required>
            <option value="Active" ${route.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${route.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </td>
        <td>
          <button class="btn btn-primary btn-sm saveRouteBtn">Save</button>
          <button class="btn btn-secondary btn-sm cancelRouteBtn">Cancel</button>
        </td>
      `;
      
      // Save button event: send updated data via PUT request
      tr.querySelector('.saveRouteBtn').addEventListener('click', async () => {
        const newRouteName = tr.querySelector('.routeName').value;
        const newTripType = tr.querySelector('.routeTripType').value;
        const newBusId = tr.querySelector('.routeBusId').value;
        const newPrice = tr.querySelector('.routePrice').value;
        const newTime = tr.querySelector('.routeTime').value;
        const newStatus = tr.querySelector('.routeStatus').value;
        try {
          const response = await fetch(`/api/admin/routes/${route.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route_name: newRouteName,
              trip_type: newTripType,
              bus_id: newBusId,
              price: newPrice,
              time: newTime,
              status: newStatus
            })
          });
          const result = await response.json();
          alert(result.message);
          fetchRoutes();
        } catch (error) {
          console.error('Error updating route:', error);
        }
      });
      
      // Cancel button event: revert to the original row
      tr.querySelector('.cancelRouteBtn').addEventListener('click', () => {
        const originalRow = createRouteRow(route);
        tr.parentNode.replaceChild(originalRow, tr);
      });
      
      return tr;
    }
  
    // Handle add route form submission
    addRouteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const route_name = document.getElementById('newRouteName').value;
      const trip_type = document.getElementById('newRouteTripType').value;
      const bus_id = document.getElementById('newRouteBusId').value;
      const price = document.getElementById('newRoutePrice').value;
      const time = document.getElementById('newRouteTime').value;
      const status = document.getElementById('newRouteStatus').value;
      try {
        const response = await fetch('/api/admin/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route_name, trip_type, bus_id, price, time, status })
        });
        const result = await response.json();
        alert('Route added successfully!');
        addRouteForm.reset();
        fetchRoutes();
      } catch (error) {
        console.error('Error adding route:', error);
      }
    });
  
    // Initial fetch: load bus list then routes
    fetchBusList();
    fetchRoutes();
  });
  