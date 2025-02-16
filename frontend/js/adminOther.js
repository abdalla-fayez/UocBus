document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('tripAutomationStatus');
    const toggleBtn = document.getElementById('toggleTripAutomationBtn');
  
    // Update the UI based on current status
    function updateUI(isEnabled) {
      statusEl.textContent = `Trip Generation is currently ${isEnabled ? 'WORKING' : 'NOT WORKING'}.`;
      toggleBtn.textContent = isEnabled ? 'Disable Trip Generation' : 'Enable Trip Generation';
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
      toggleTripAutomation();
    });
  
    // Initial fetch of the event status when the page loads
    fetchTripAutomationStatus();
  });
  