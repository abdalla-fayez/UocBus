import permissionsManager from './permissions.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize permissions
  await permissionsManager.init();

  // Redirect if no permission to manage buses
  if (!permissionsManager.hasPermission('manage_buses')) {
    window.location.href = 'adminDashboard.html';
    return;
  }

  const busesTableBody = document.querySelector('#busesTable tbody');
  const addBusForm = document.getElementById('addBusForm');
  
  let busesData = []; // Array to store fetched buses
  // Fetch all buses from the API endpoint
  async function fetchBuses() {
    try {
      const response = await permissionsManager.fetchWithPermission('/api/admin/buses');
      if (response.ok) {
        busesData = await response.json();
        renderBuses(busesData);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to fetch buses');
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      if (error.message === 'Permission denied') {
        window.location.href = 'adminDashboard.html';
      }
    }
  }

  // Render all buses into the table
  function renderBuses(buses) {
    busesTableBody.innerHTML = '';
    buses.forEach(bus => {
      const row = createBusRow(bus);
      busesTableBody.appendChild(row);
    });
  }

  // Create a normal table row for a bus
  function createBusRow(bus) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${bus.id}</td>
      <td>${bus.name}</td>
      <td>${bus.vacant_seats}</td>
      <td>${bus.driver_mobile || 'N/A'}</td>
      <td>
        <button class="btn btn-primary btn-sm editBusBtn" data-id="${bus.id}">Edit</button>
        <button class="btn btn-danger btn-sm deleteBusBtn" data-id="${bus.id}">Delete</button>
      </td>
    `;
    // Attach event listener for "Edit"
    tr.querySelector('.editBusBtn').addEventListener('click', () => {
      const editRow = createEditBusRow(bus);
      tr.parentNode.replaceChild(editRow, tr);
    });
    // Attach event listener for "Delete"
    tr.querySelector('.deleteBusBtn').addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this bus?')) {
        try {
          const response = await fetch(`/api/admin/buses/${bus.id}`, { method: 'DELETE' });
          const result = await response.json();
          alert(result.message);
          fetchBuses(); // Refresh the list after deletion
        } catch (error) {
          console.error('Error deleting bus:', error);
        }
      }
    });
    return tr;
  }

  // Create an inline edit form row for a bus
  function createEditBusRow(bus) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${bus.id}</td>
      <td><input type="text" class="form-control form-control-sm busName" value="${bus.name}" required></td>
      <td><input type="number" class="form-control form-control-sm busVacantSeats" value="${bus.vacant_seats}" required></td>
      <td><input type="text" class="form-control form-control-sm busDriverMobile" value="${bus.driver_mobile}" required></td>
      <td>
        <button class="btn btn-primary btn-sm saveBusBtn">Save</button>
        <button class="btn btn-secondary btn-sm cancelBusBtn">Cancel</button>
      </td>
    `;
  
    // Save button: update the bus record via a PUT request
    tr.querySelector('.saveBusBtn').addEventListener('click', async () => {
      // Use the new classes to select the correct fields
      const newName = tr.querySelector('.busName').value;
      const newVacantSeats = tr.querySelector('.busVacantSeats').value;
      const newDriverMobile = tr.querySelector('.busDriverMobile').value;
      try {
        const response = await fetch(`/api/admin/buses/${bus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, vacant_seats: newVacantSeats, driver_mobile: newDriverMobile })
        });
        const result = await response.json();
        alert(result.message);
        fetchBuses(); // Refresh the list after update
      } catch (error) {
        console.error('Error updating bus:', error);
      }
    });
  
    // Cancel button: revert back to the original row
    tr.querySelector('.cancelBusBtn').addEventListener('click', () => {
      const originalRow = createBusRow(bus);
      tr.parentNode.replaceChild(originalRow, tr);
    });
  
    return tr;
  }

  // Submit the "Add New Bus" form
  addBusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newBusName').value;
    const vacant_seats = document.getElementById('newBusVacantSeats').value;
    const driver_mobile = document.getElementById('newBusDriverMobile').value;
    try {
      const response = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, vacant_seats, driver_mobile })
      });
      const result = await response.json();
      alert('Bus added successfully!');
      addBusForm.reset();
      fetchBuses(); // Refresh the list to include the new bus
    } catch (error) {
      console.error('Error adding bus:', error);
    }
  });
  
  // Initial fetch of buses when the page loads
  fetchBuses();
});
