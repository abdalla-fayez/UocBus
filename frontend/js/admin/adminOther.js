import permissionsManager from './permissions.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize permissions
  await permissionsManager.init();

  // Redirect if no permissions for this page
  if (!permissionsManager.hasPermission('manage_automation') && 
      !permissionsManager.hasPermission('generate_reports') &&
      !permissionsManager.hasPermission('manage_system_config')) {
    window.location.href = 'adminDashboard.html';
    return;
  }

  const statusEl = document.getElementById('tripAutomationStatus');
  const toggleBtn = document.getElementById('toggleTripAutomationBtn');
  const generateTripsBtn = document.getElementById('generateTripsBtn');
  const tripGenerationStatus = document.getElementById('tripGenerationStatus');
  const ticketAllowanceInput = document.getElementById('ticketAllowanceInput');
  const updateTicketAllowanceBtn = document.getElementById('updateTicketAllowanceBtn');
  const currentTicketAllowance = document.getElementById('currentTicketAllowance');
  const ticketAllowanceStatus = document.getElementById('ticketAllowanceStatus');
  const resetBookingCountersBtn = document.getElementById('resetBookingCountersBtn');
  const resetCounterStatus = document.getElementById('resetCounterStatus');

  // Update the UI based on current status
  function updateUI(isEnabled) {
    statusEl.textContent = `Trip Generation is currently ${isEnabled ? 'WORKING' : 'NOT WORKING'}.`;
    toggleBtn.textContent = isEnabled ? 'Disable Trip Generation' : 'Enable Trip Generation';

    // Update button color based on status
    if (isEnabled) {
        toggleBtn.classList.remove('btn-success');
        toggleBtn.classList.add('btn-danger');
    } else {
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-success');
    }
  }
  // Fetch the current status from the backend
  async function fetchTripAutomationStatus() {
    try {
      const response = await permissionsManager.fetchWithPermission('/api/admin/other/trip-automation-status');
      const data = await response.json();
      if (response.ok) {
        updateUI(data.enabled);
      } else {
        console.error('Error:', data.error);
        if (response.status === 403) {
          statusEl.textContent = 'You do not have permission to view automation status.';
        }
      }
    } catch (error) {
      console.error('Error fetching trip automation status:', error);
      statusEl.textContent = 'Error fetching status.';
    }
  }

  // Toggle the event status on the backend
  async function toggleTripAutomation() {
    try {
      const response = await permissionsManager.fetchWithPermission('/api/admin/other/toggle-trip-automation', {
        method: 'POST'
      });
      const data = await response.json();
      updateUI(data.enabled);
    } catch (error) {
      console.error('Error toggling trip automation:', error);
      alert('Error toggling trip automation.');
    }
  }

  // Manual Trip Generation
  async function generateTripsManually() {
    try {
      generateTripsBtn.disabled = true;
      tripGenerationStatus.textContent = 'Generating trips...';
      tripGenerationStatus.className = 'mt-2 text-info';

      const response = await permissionsManager.fetchWithPermission('/api/admin/other/manual-trip-generation', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        tripGenerationStatus.textContent = 'Trips generated successfully!';
        tripGenerationStatus.className = 'mt-2 text-success';
      } else {
        tripGenerationStatus.textContent = `Error: ${data.error}`;
        tripGenerationStatus.className = 'mt-2 text-danger';
      }
    } catch (error) {
      console.error('Error generating trips:', error);
      tripGenerationStatus.textContent = 'Error generating trips. Please try again.';
      tripGenerationStatus.className = 'mt-2 text-danger';
    } finally {
      generateTripsBtn.disabled = false;
    }
  }

  // Fetch current ticket allowance from the backend
  async function fetchTicketAllowance() {
    try {
      const response = await permissionsManager.fetchWithPermission('/api/admin/config/ticket-allowance');
      const data = await response.json();
      if (response.ok) {
        ticketAllowanceInput.value = data.value;
        currentTicketAllowance.textContent = data.value;
      } else {
        console.error('Error:', data.error);
        if (response.status === 403) {
          ticketAllowanceStatus.textContent = 'You do not have permission to view this configuration.';
          ticketAllowanceStatus.className = 'mt-2 text-danger';
        }
      }
    } catch (error) {
      console.error('Error fetching ticket allowance:', error);
      ticketAllowanceStatus.textContent = 'Error fetching current value.';
      ticketAllowanceStatus.className = 'mt-2 text-danger';
    }
  }

  // Update ticket allowance in the backend
  async function updateTicketAllowance() {
    const value = parseInt(ticketAllowanceInput.value);
    if (!Number.isInteger(value) || value < 1) {
      ticketAllowanceStatus.textContent = 'Please enter a valid positive number.';
      ticketAllowanceStatus.className = 'mt-2 text-danger';
      return;
    }

    try {
      updateTicketAllowanceBtn.disabled = true;
      ticketAllowanceStatus.textContent = 'Updating...';
      ticketAllowanceStatus.className = 'mt-2 text-info';

      const response = await permissionsManager.fetchWithPermission('/api/admin/config/ticket-allowance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value })
      });

      const data = await response.json();
      
      if (response.ok) {
        currentTicketAllowance.textContent = value;
        ticketAllowanceStatus.textContent = 'Update successful!';
        ticketAllowanceStatus.className = 'mt-2 text-success';
      } else {
        ticketAllowanceStatus.textContent = `Error: ${data.error}`;
        ticketAllowanceStatus.className = 'mt-2 text-danger';
      }
    } catch (error) {
      console.error('Error updating ticket allowance:', error);
      ticketAllowanceStatus.textContent = 'Error updating value. Please try again.';
      ticketAllowanceStatus.className = 'mt-2 text-danger';
    } finally {
      updateTicketAllowanceBtn.disabled = false;
    }
  }

  // Reset booking counters for all users
  async function resetBookingCounters() {
    try {
      resetBookingCountersBtn.disabled = true;
      resetCounterStatus.textContent = 'Resetting counters...';
      resetCounterStatus.className = 'mt-2 text-info';

      const response = await permissionsManager.fetchWithPermission('/api/admin/config/reset-bookings-counter', {
        method: 'POST'
      });

      const data = await response.json();
      
      if (response.ok) {
        resetCounterStatus.textContent = 'Booking counters reset successfully!';
        resetCounterStatus.className = 'mt-2 text-success';
      } else {
        resetCounterStatus.textContent = `Error: ${data.error}`;
        resetCounterStatus.className = 'mt-2 text-danger';
      }
    } catch (error) {
      console.error('Error resetting booking counters:', error);
      resetCounterStatus.textContent = 'Error resetting counters. Please try again.';
      resetCounterStatus.className = 'mt-2 text-danger';
    } finally {
      resetBookingCountersBtn.disabled = false;
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // If the current button text indicates disabling, show confirmation
    if (toggleBtn.textContent.trim().toLowerCase().includes('disable')) {
      if (!confirm("Are you sure you want to DISABLE trip generation?")) {
        return; // Abort if user cancels
      }
    }
    toggleTripAutomation();
  });
  
  generateTripsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to generate trips now?")) {
      generateTripsManually();
    }
  });

  if (updateTicketAllowanceBtn) {
    updateTicketAllowanceBtn.addEventListener('click', updateTicketAllowance);
  }

  resetBookingCountersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to reset the bookings counter for all students? This action cannot be undone.")) {
      resetBookingCounters();
    }
  });

  // Initial fetch of the event status when the page loads
  fetchTripAutomationStatus();
  if (permissionsManager.hasPermission('manage_system_config')) {
    fetchTicketAllowance();
  }
});
