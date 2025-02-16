document.addEventListener('DOMContentLoaded', () => {
const routesTableBody = document.querySelector('#routesTable tbody');
const addRouteForm = document.getElementById('addRouteForm');
const editRouteSection = document.getElementById('editRouteSection');
const editRouteForm = document.getElementById('editRouteForm');
const cancelRouteEdit = document.getElementById('cancelRouteEdit');

let routesData = []; // Stores the fetched routes
let busList = [];    // Stores the fetched buses

// Fetch bus list for populating drop-downs
async function fetchBusList() {
    try {
    const response = await fetch('/api/admin/buses');
    busList = await response.json();
    populateBusSelects();
    } catch (error) {
    console.error('Error fetching bus list:', error);
    }
}

// Populate the bus drop-down selects in both add and edit forms
function populateBusSelects() {
    const newRouteBusSelect = document.getElementById('newRouteBusId');
    const editRouteBusSelect = document.getElementById('editRouteBusId');
    newRouteBusSelect.innerHTML = '';
    editRouteBusSelect.innerHTML = '';
    busList.forEach(bus => {
    const option = document.createElement('option');
    option.value = bus.id;
    option.textContent = bus.name;
    newRouteBusSelect.appendChild(option.cloneNode(true));
    editRouteBusSelect.appendChild(option.cloneNode(true));
    });
}

// Fetch routes from API
async function fetchRoutes() {
    try {
    const response = await fetch('/api/admin/routes');
    const routes = await response.json();
    routesData = routes;
    renderRoutes(routes);
    } catch (error) {
    console.error('Error fetching routes:', error);
    }
}

// Render routes into the table, using busList to display the bus name
function renderRoutes(routes) {
    routesTableBody.innerHTML = '';
    routes.forEach(route => {
    // Look up bus name by bus_id
    const bus = busList.find(b => b.id == route.bus_id);
    const busName = bus ? bus.name : 'N/A';
    const row = document.createElement('tr');
    row.innerHTML = `
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
    routesTableBody.appendChild(row);
    });

    // Attach event listeners for edit and delete buttons
    document.querySelectorAll('.editRouteBtn').forEach(button => {
    button.addEventListener('click', handleEditRoute);
    });
    document.querySelectorAll('.deleteRouteBtn').forEach(button => {
    button.addEventListener('click', handleDeleteRoute);
    });
}

// Handle "Edit" button click for a route
function handleEditRoute(e) {
    const routeId = e.target.getAttribute('data-id');
    const route = routesData.find(r => r.id == routeId);
    if (route) {
    document.getElementById('routeId').value = route.id;
    document.getElementById('editRouteName').value = route.route_name;
    document.getElementById('editRouteTripType').value = route.trip_type;
    document.getElementById('editRouteBusId').value = route.bus_id;
    document.getElementById('editRoutePrice').value = route.price;
    document.getElementById('editRouteTime').value = route.time;
    document.getElementById('editRouteStatus').value = route.status;
    editRouteSection.style.display = 'block';
    editRouteSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle "Delete" button click for a route
async function handleDeleteRoute(e) {
    const routeId = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this route?')) {
    try {
        const response = await fetch(`/api/admin/routes/${routeId}`, { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
        fetchRoutes();
    } catch (error) {
        console.error('Error deleting route:', error);
    }
    }
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

// Handle edit route form submission
editRouteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('routeId').value;
    const route_name = document.getElementById('editRouteName').value;
    const trip_type = document.getElementById('editRouteTripType').value;
    const bus_id = document.getElementById('editRouteBusId').value;
    const price = document.getElementById('editRoutePrice').value;
    const time = document.getElementById('editRouteTime').value;
    const status = document.getElementById('editRouteStatus').value;
    try {
    const response = await fetch(`/api/admin/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_name, trip_type, bus_id, price, time, status })
    });
    const result = await response.json();
    alert(result.message);
    editRouteSection.style.display = 'none';
    fetchRoutes();
    } catch (error) {
    console.error('Error updating route:', error);
    }
});

// Cancel editing and hide the edit form
cancelRouteEdit.addEventListener('click', () => {
    editRouteSection.style.display = 'none';
});

// Initial fetch: load bus list then routes
fetchBusList();
fetchRoutes();
});
