document.addEventListener('DOMContentLoaded', () => {
    const busesTableBody = document.querySelector('#busesTable tbody');
    const editSection = document.getElementById('editBusSection');
    const editForm = document.getElementById('editBusForm');
    const cancelEdit = document.getElementById('cancelEdit');
    const addBusForm = document.getElementById('addBusForm');
    
    let busesData = []; // To store the fetched buses
  
    // Fetch all buses from the API endpoint
    async function fetchBuses() {
      try {
        const response = await fetch('/api/admin/buses');
        const buses = await response.json();
        busesData = buses;
        renderBuses(buses);
      } catch (error) {
        console.error('Error fetching buses:', error);
      }
    }
  
    // Render the buses into the table
    function renderBuses(buses) {
      busesTableBody.innerHTML = '';
      buses.forEach(bus => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${bus.id}</td>
          <td>${bus.name}</td>
          <td>${bus.vacant_seats}</td>
          <td>${bus.driver_mobile || 'N/A'}</td>
          <td>
            <button class="btn btn-primary btn-sm editBtn" data-id="${bus.id}">Edit</button>
            <button class="btn btn-danger btn-sm deleteBtn" data-id="${bus.id}">Delete</button>
          </td>
        `;
        busesTableBody.appendChild(row);
      });
  
      // Attach event listeners for edit buttons
      document.querySelectorAll('.editBtn').forEach(button => {
        button.addEventListener('click', handleEditClick);
      });
      
      // Attach event listeners for delete buttons
      document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', handleDeleteClick);
      });
    }
  
    // Handle the "Edit" button click event
    function handleEditClick(e) {
      const busId = e.target.getAttribute('data-id');
      const bus = busesData.find(b => b.id == busId);
      if (bus) {
        // Populate the edit form with bus details (ID remains hidden)
        document.getElementById('busId').value = bus.id;
        document.getElementById('busName').value = bus.name;
        document.getElementById('busVacantSeats').value = bus.vacant_seats;
        document.getElementById('busDriverMobile').value = bus.driver_mobile || '';
        // Show the edit form
        editSection.style.display = 'block';
        editSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  
    // Handle the "Delete" button click event
    async function handleDeleteClick(e) {
      const busId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this bus?')) {
        try {
          const response = await fetch(`/api/admin/buses/${busId}`, { method: 'DELETE' });
          const result = await response.json();
          alert(result.message);
          fetchBuses(); // Refresh the list after deletion
        } catch (error) {
          console.error('Error deleting bus:', error);
        }
      }
    }
  
    // Submit the edit form to update a bus
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // The bus ID is taken from the hidden field and is not editable by the user
      const id = document.getElementById('busId').value;
      const name = document.getElementById('busName').value;
      const vacant_seats = document.getElementById('busVacantSeats').value;
      const driver_mobile = document.getElementById('busDriverMobile').value;
      try {
        const response = await fetch(`/api/admin/buses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, vacant_seats, driver_mobile })
        });
        const result = await response.json();
        alert(result.message);
        editSection.style.display = 'none'; // Hide the edit form after submission
        fetchBuses(); // Refresh the list after update
      } catch (error) {
        console.error('Error updating bus:', error);
      }
    });
  
    // Cancel editing and hide the edit form
    cancelEdit.addEventListener('click', () => {
      editSection.style.display = 'none';
    });
  
    // Submit the add bus form to create a new bus
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
        // Clear the form
        addBusForm.reset();
        fetchBuses(); // Refresh the list to include the new bus
      } catch (error) {
        console.error('Error adding bus:', error);
      }
    });
  
    // Initial fetch of buses when the page loads
    fetchBuses();
  });
  