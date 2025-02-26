document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('tripAutomationStatus');
  const toggleBtn = document.getElementById('toggleTripAutomationBtn');
  const downloadReportBtn = document.getElementById('downloadReportBtn');

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
      const response = await fetch('/api/admin/other/trip-automation-status', { credentials: 'include' });
      const data = await response.json();
      updateUI(data.enabled);
    } catch (error) {
      console.error('Error fetching trip automation status:', error);
      statusEl.textContent = 'Error fetching status.';
    }
  }

  // Toggle the event status on the backend
  async function toggleTripAutomation() {
    try {
      const response = await fetch('/api/admin/other/toggle-trip-automation', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      updateUI(data.enabled);
    } catch (error) {
      console.error('Error toggling trip automation:', error);
      alert('Error toggling trip automation.');
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

  // Handle report download
  downloadReportBtn.addEventListener('click', () => {
    const reportDate = document.getElementById('reportDate').value;
    if (!reportDate) {
      alert('Please select a trip date before downloading the report.');
      return;
    }
    const downloadUrl = `/api/admin/bookingsreport?date=${reportDate}`;
    window.location.href = downloadUrl;
  });
  
  // Initial fetch of the event status when the page loads
  fetchTripAutomationStatus();
});
