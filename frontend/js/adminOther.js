import permissionsManager from './permissions.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize permissions
  await permissionsManager.init();

  // Redirect if no permissions for this page
  if (!permissionsManager.hasPermission('manage_automation') && 
      !permissionsManager.hasPermission('generate_reports')) {
    window.location.href = 'adminDashboard.html';
    return;
  }

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
  downloadReportBtn.addEventListener('click', async () => {
    if (!permissionsManager.hasPermission('generate_reports')) {
      alert('You do not have permission to generate reports.');
      return;
    }

    const reportDate = document.getElementById('reportDate').value;
    if (!reportDate) {
      alert('Please select a date before downloading the report.');
      return;
    }

    try {
      const response = await permissionsManager.fetchWithPermission(`/api/admin/dailypaymentsreport?date=${reportDate}`);
      const contentType = response.headers.get("content-type");
      
      // If the response is JSON, parse it and display the message
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if(data.message) {
          alert(data.message);
        } else if(data.error) {
          alert(data.error);
        }
      } else {
        // Otherwise, if it's CSV, create a blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-report-${reportDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error(err);
      if (err.message === 'Permission denied') {
        alert('You do not have permission to generate reports.');
      } else {
        alert("An error occurred: " + err.message);
      }
    }
  });
  
  // Initial fetch of the event status when the page loads
  fetchTripAutomationStatus();
});
